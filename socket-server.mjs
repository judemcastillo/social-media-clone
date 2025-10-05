import { createServer } from "http";
import { Server } from "socket.io";
import { jwtVerify } from "jose";
import prisma from "./src/lib/prisma.js";

const PORT = Number(process.env.SOCKET_PORT || 4001);
const CLIENT_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Use the same secret you use to SIGN your optional socket tokens
const SOCKET_SECRET = new TextEncoder().encode(
	process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
);

async function getMemberUserIds(conversationId) {
	const members = await prisma.conversationParticipant.findMany({
		where: { conversationId },
		select: { userId: true },
	});
	return members.map((m) => m.userId);
}

function parseCookie(cookieHeader = "", name) {
	const match = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
	return match ? decodeURIComponent(match[1]) : null;
}

async function verifySocketToken(token) {
	const { payload } = await jwtVerify(token, SOCKET_SECRET);
	// Expecting you to sign payload like: { sub: userId, role: 'USER' }
	return { userId: payload.sub, role: payload.role || "USER" };
}

async function authenticate(socket) {
	// 1) Try an explicit socket token from the client
	const token = socket.handshake?.auth?.token;
	if (token) {
		return await verifySocketToken(token);
	}

	// 2) Fallback to NextAuth session cookie (DB sessions)
	const cookie = socket.handshake.headers?.cookie || "";
	// v5 cookie names (Auth.js / NextAuth):
	const sessionToken =
		parseCookie(cookie, "__Secure-authjs.session-token") ||
		parseCookie(cookie, "authjs.session-token") ||
		// older names (just in case)
		parseCookie(cookie, "__Secure-next-auth.session-token") ||
		parseCookie(cookie, "next-auth.session-token");

	if (!sessionToken) return null;

	const session = await prisma.session.findUnique({
		where: { sessionToken },
		include: { user: true },
	});
	if (!session) return null;
	if (session.expires && new Date(session.expires) < new Date()) return null;

	return { userId: session.userId, role: session.user.role };
}

// … imports + env + helpers (parseCookie, verifySocketToken, authenticate, hydrateConversation, emitConversationNew) stay the same

const httpServer = createServer();
const io = new Server(httpServer, {
	cors: { origin: CLIENT_URL, credentials: true },
});

io.use(async (socket, next) => {
	try {
		const auth = await authenticate(socket);
		if (!auth?.userId || auth.role === "GUEST")
			return next(new Error("auth failed"));
		socket.data.userId = auth.userId;
		socket.data.role = auth.role;
		next();
	} catch {
		next(new Error("auth failed"));
	}
});

io.on("connection", (socket) => {
	const userId = socket.data.userId;

	// user presence room
	socket.join(`user:${userId}`);
	io.to(`user:${userId}`).emit("presence:online", { userId });

	// ---- JOIN A CONVERSATION ROOM ----
	socket.on("conversation:join", async ({ conversationId }) => {
		const conv = await prisma.conversation.findUnique({
			where: { id: conversationId },
			select: {
				isPublic: true,
				participants: {
					where: { userId },
					select: { userId: true, status: true },
				},
			},
		});
		if (!conv) return;
		const isMember = conv.participants.some(
			(p) => p.userId === userId && p.status === "JOINED"
		);
		if (!conv.isPublic && !isMember) return;
		socket.join(`c:${conversationId}`);
		socket.emit("conversation:joined", { conversationId });
	});

	// ---- START/GET A DM ----
	socket.on("conversation:dm", async ({ otherUserId }) => {
		try {
			if (!otherUserId || otherUserId === userId) return;

			const other = await prisma.user.findUnique({
				where: { id: otherUserId },
				select: { id: true, role: true },
			});
			if (!other || other.role === "GUEST") return;

			let conv = await prisma.conversation.findFirst({
				where: {
					isPublic: false,
					isGroup: false,
					participants: { some: { userId } },
					AND: { participants: { some: { userId: otherUserId } } },
				},
				select: { id: true },
			});

			if (!conv) {
				conv = await prisma.conversation.create({
					data: {
						isPublic: false,
						isGroup: false,
						createdById: userId,
						participants: { create: [{ userId }, { userId: otherUserId }] },
					},
					select: { id: true },
				});
			}

			const payload = await hydrateConversation(conv.id);
			emitConversationNew(io, payload, [userId, otherUserId]);

			socket.join(`c:${conv.id}`);
			socket.emit("conversation:joined", { conversationId: conv.id });
		} catch (e) {
			console.error("conversation:dm error:", e);
			socket.emit("error", { message: "Failed to start DM" });
		}
	});

	// ---- CREATE GROUP ----
	socket.on("conversation:group:create", async ({ title, memberIds = [] }) => {
		try {
			const uniqueIds = Array.from(new Set([userId, ...memberIds])).filter(
				Boolean
			);
			const validUsers = await prisma.user.findMany({
				where: { id: { in: uniqueIds }, role: { not: "GUEST" } },
				select: { id: true },
			});
			const finalIds = validUsers.map((u) => u.id);
			if (finalIds.length < 2) {
				return socket.emit("error", { message: "Not enough members" });
			}

			const conv = await prisma.conversation.create({
				data: {
					isPublic: false,
					isGroup: true,
					title: title?.trim() || null,
					createdById: userId,
					participants: {
						create: finalIds.map((uid) => ({
							userId: uid,
							status: "JOINED",
							role: uid === userId ? "ADMIN" : "MEMBER",
						})),
					},
				},
				select: { id: true },
			});

			const payload = await hydrateConversation(conv.id);
			emitConversationNew(io, payload, finalIds);
		} catch (e) {
			console.error("conversation:group:create error:", e);
			socket.emit("error", { message: "Failed to create group" });
		}
	});

	// ---- SEND MESSAGE ----
	socket.on(
		"message:send",
		async ({ conversationId, content, attachments }) => {
			try {
				const conv = await prisma.conversation.findUnique({
					where: { id: conversationId },
					select: {
						isPublic: true,
						participants: {
							where: { userId },
							select: { userId: true, status: true },
						},
					},
				});
				if (!conv) return;

				const isMember = conv.participants.some(
					(p) => p.userId === userId && p.status === "JOINED"
				);
				if (!conv.isPublic && !isMember) return;

				const msg = await prisma.message.create({
					data: {
						conversationId,
						authorId: userId,
						content: content?.trim() || null,
						attachments: {
							create: (attachments || []).map((a) => ({
								url: a.url,
								type: a.type || "image",
								width: a.width || null,
								height: a.height || null,
								size: a.size || null,
							})),
						},
					},
					include: {
						author: { select: { id: true, name: true, image: true } },
						attachments: true,
					},
				});

				// 🔔 Broadcast to the conversation room so sockets that joined the room
				// receive the event directly. Also notify each participant's user room
				// for any clients that haven't joined the conversation room yet.
				// Clients dedupe duplicate events by message id.
				io.to(`c:${conversationId}`).emit("message:new", { message: msg });

				const memberIds = await getMemberUserIds(conversationId);
				memberIds.forEach((uid) => {
					io.to(`user:${uid}`).emit("message:new", { message: msg });
				});
			} catch (e) {
				console.error("message:send error:", e);
				socket.emit("error", { message: "Failed to send message" });
			}
		}
	);

	// ---- TYPING ----
	socket.on("typing:start", ({ conversationId }) => {
		socket.to(`c:${conversationId}`).emit("typing", { userId, typing: true });
	});
	socket.on("typing:stop", ({ conversationId }) => {
		socket.to(`c:${conversationId}`).emit("typing", { userId, typing: false });
	});

	// ---- DISCONNECT ----
	socket.on("disconnect", () => {
		io.emit("presence:offline", { userId });
	});

	// Development-only test helper: trigger the same emission path without DB
	// Usage (only when NODE_ENV !== 'production'):
	// socket.emit('__test:emit', { conversationId, message, memberIds: ['userA','userB'] })
	if (process.env.NODE_ENV !== "production") {
		socket.on(
			"__test:emit",
			async ({ conversationId, message, memberIds = null }) => {
				try {
					// emit to conversation room first
					io.to(`c:${conversationId}`).emit("message:new", { message });

					// determine memberIds if not provided
					if (!memberIds) {
						memberIds = await getMemberUserIds(conversationId);
					}

					// Build set of socket ids in conversation room so we can avoid
					// double-notifying sockets that are already in the room.
					const convRoom =
						io.sockets.adapter.rooms.get(`c:${conversationId}`) || new Set();

					for (const uid of memberIds) {
						const userRoom = io.sockets.adapter.rooms.get(`user:${uid}`);
						if (!userRoom) continue;
						for (const sid of userRoom) {
							if (convRoom.has(sid)) continue; // socket already in conversation room
							io.to(sid).emit("message:new", { message });
						}
					}
				} catch (e) {
					console.error("__test:emit error", e);
				}
			}
		);
	}
});

httpServer.listen(PORT, () => {
	console.log(`🔌 Socket.IO server running on :${PORT}`);
});
