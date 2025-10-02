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

const httpServer = createServer();
const io = new Server(httpServer, {
	cors: { origin: CLIENT_URL, credentials: true },
});

io.use(async (socket, next) => {
	try {
		const auth = await authenticate(socket);
		if (!auth?.userId) return next(new Error("auth failed"));
		if (auth.role === "GUEST") return next(new Error("auth failed"));
		socket.data.userId = auth.userId;
		socket.data.role = auth.role;
		next();
	} catch (e) {
		next(new Error("auth failed"));
	}
});

io.on("connection", (socket) => {
	const userId = socket.data.userId;
	socket.join(`user:${userId}`);
	io.to(`user:${userId}`).emit("presence:online", { userId });

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

	socket.on(
		"message:send",
		async ({ conversationId, content, attachments }) => {
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

			io.to(`c:${conversationId}`).emit("message:new", { message: msg });
		}
	);

	socket.on("typing:start", ({ conversationId }) => {
		socket.to(`c:${conversationId}`).emit("typing", { userId, typing: true });
	});
	socket.on("typing:stop", ({ conversationId }) => {
		socket.to(`c:${conversationId}`).emit("typing", { userId, typing: false });
	});

	socket.on("disconnect", () => {
		io.emit("presence:offline", { userId });
	});
});

httpServer.listen(PORT, () => {
	console.log(`🔌 Socket.IO server running on :${PORT}`);
});
