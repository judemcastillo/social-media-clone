// src/lib/actions/conversation-actions.js
"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { requireNonGuest } from "./_auth-guards";

function requireUserId(session) {
	const id = session?.user?.id;
	if (!id) throw new Error("Unauthorized");
	const role = session?.user?.role || "USER";
	if (role === "GUEST") throw new Error("Guests cannot use chat");
	return id;
}

export async function getOrCreateDM(viewerId, otherUserId) {
	if (!otherUserId) throw new Error("Missing user id");
	if (viewerId === otherUserId) throw new Error("Cannot DM yourself");

	const existing = await prisma.conversation.findFirst({
		where: {
			isPublic: false,
			isGroup: false,
			participants: { some: { userId: viewerId } },
			AND: { participants: { some: { userId: otherUserId } } },
		},
		select: { id: true, isPublic: true, isGroup: true },
	});
	if (existing) return existing;

	return prisma.conversation.create({
		data: {
			isPublic: false,
			isGroup: false,
			createdById: viewerId,
			participants: {
				create: [
					{ userId: viewerId, status: "JOINED", role: "MEMBER" },
					{ userId: otherUserId, status: "JOINED", role: "MEMBER" },
				],
			},
		},
		select: { id: true, isPublic: true, isGroup: true },
	});
}

export async function upsertDirectConversation(targetUserId) {
	const session = await auth();
	const me = requireUserId(session);

	if (!targetUserId || targetUserId === me) throw new Error("Bad target");

	// Re-use if exists: a non-group conv with both participants JOINED
	const existing = await prisma.conversation.findFirst({
		where: {
			isGroup: false,
			participants: { some: { userId: me } },
			AND: [{ participants: { some: { userId: targetUserId } } }],
		},
		select: { id: true },
	});
	if (existing) return { ok: true, conversationId: existing.id };

	const conv = await prisma.conversation.create({
		data: {
			isGroup: false,
			isPublic: false,
			createdById: me,
			participants: {
				create: [
					{ userId: me, role: "ADMIN", status: "JOINED" },
					{ userId: targetUserId, role: "MEMBER", status: "JOINED" },
				],
			},
		},
		select: { id: true },
	});

	return { ok: true, conversationId: conv.id };
}

export async function createGroupConversation({ title, memberIds = [] }) {
	const session = await auth();
	const me = requireUserId(session);
	const unique = Array.from(new Set(memberIds.filter((id) => id && id !== me)));
	const conv = await prisma.conversation.create({
		data: {
			isGroup: true,
			isPublic: false,
			title: title?.trim() || null,
			createdById: me,
			participants: {
				create: [
					{ userId: me, role: "ADMIN", status: "JOINED" },
					...unique.map((uid) => ({
						userId: uid,
						role: "MEMBER",
						status: "INVITED",
					})),
				],
			},
		},
		select: { id: true },
	});
	return { ok: true, conversationId: conv.id };
}

export async function createPublicRoom({ title }) {
	const session = await auth();
	const me = requireUserId(session);
	const conv = await prisma.conversation.create({
		data: {
			isGroup: true,
			isPublic: true,
			title: title?.trim() || null,
			createdById: me,
			participants: {
				create: [{ userId: me, role: "ADMIN", status: "JOINED" }],
			},
		},
		select: { id: true },
	});
	return { ok: true, conversationId: conv.id };
}

export async function joinPublicRoom(conversationId) {
	const session = await auth();
	const me = requireUserId(session);
	const conv = await prisma.conversation.findUnique({
		where: { id: conversationId },
		select: { isPublic: true },
	});
	if (!conv?.isPublic) throw new Error("Not a public room");

	await prisma.conversationParticipant.upsert({
		where: { conversationId_userId: { conversationId, userId: me } },
		update: { status: "JOINED" },
		create: { conversationId, userId: me, status: "JOINED" },
	});
	return { ok: true };
}

export async function fetchConversations() {
	const session = await auth();
	if (!session?.user?.id) return { conversations: [] };
	const viewerId = session.user.id;

	const rows = await prisma.conversation.findMany({
		where: {
			OR: [
				{ participants: { some: { userId: viewerId } } },
				{ isPublic: true },
			],
		},
		orderBy: { updatedAt: "desc" },
		select: {
			id: true,
			title: true,
			isGroup: true,
			isPublic: true,
			participants: {
				select: { user: { select: { id: true, name: true, image: true } } },
			},
			messages: {
				orderBy: { createdAt: "desc" },
				take: 1,
				select: {
					id: true,
					content: true,
					createdAt: true,
					conversationId: true,
					author: { select: { id: true, name: true } },
					attachments: { select: { id: true } },
				},
			},
		},
	});

	const ids = rows.map((r) => r.id);
	if (!ids.length) return { conversations: [] };

	const unreadGrouped = await prisma.message.groupBy({
		by: ["conversationId"],
		where: {
			conversationId: { in: ids },
			authorId: { not: viewerId },
			reads: { none: { userId: viewerId } },
		},
		_count: { _all: true },
	});

	const unreadMap = Object.fromEntries(
		unreadGrouped.map((g) => [g.conversationId, g._count._all])
	);

	const conversations = rows.map((r) => ({
		...r,
		unreadCount: unreadMap[r.id] || 0,
	}));

	return { conversations };
}

export async function fetchMessagesPage({
	id,
	kind = "dm",
	cursor = null,
	limit = 30,
}) {
	const session = await auth();
	const viewerId = requireUserId(session);
	const take = Math.min(Number(limit) || 30, 100);

	let conv = null;
	let peers = null;

	if (kind === "group") {
		conv = await prisma.conversation.findUnique({
			where: { id },
			select: {
				id: true,
				title: true,
				isPublic: true,
				isGroup: true,
				participants: {
					select: { user: { select: { id: true, name: true, image: true } } },
				},
			},
		});
		peers = (conv.participants || []).map((p) => p.user).filter(Boolean);
		if (!conv || !conv.isGroup) return { ok: false, error: "Not a group." };
	} else if (kind === "room") {
		conv = await prisma.conversation.findUnique({
			where: { id },
			select: {
				id: true,
				title: true,
				isPublic: true,
				isGroup: true,
				participants: {
					select: { user: { select: { id: true, name: true, image: true } } },
				},
			},
		});
		peers = (conv.participants || []).map((p) => p.user).filter(Boolean);
		if (!conv || !conv.isPublic) return { ok: false, error: "Not a room." };
	} else {
		// DM: id is other user's id
		const otherUserId = id;
		const dm = await getOrCreateDM(viewerId, otherUserId);
		conv = await prisma.conversation.findUnique({
			where: { id: dm.id },
			select: {
				id: true,
				title: true,
				isPublic: true,
				isGroup: true,
				participants: {
					select: { user: { select: { id: true, name: true, image: true } } },
				},
			},
		});
		const allUsers = (conv?.participants || [])
			.map((p) => p.user)
			.filter(Boolean);

		// for DM, peers = only the other person (exclude viewer)
		peers = allUsers.filter((u) => u.id !== viewerId);
	}

	let title = conv.title || "";
	if (!title) {
		if (conv.isGroup) {
			title = "Group";
		} else if (conv.isPublic) {
			title = "Room";
		} else {
			const others = peers.filter((u) => u.id !== viewerId);
			title = others.length ? others[0].name || "User" : "Conversation";
		}
	}

	// Messages (cursor by id, newest->oldest then reverse for normal display)
	const rows = await prisma.message.findMany({
		where: { conversationId: conv.id },
		take: take + 1,
		...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
		orderBy: { id: "desc" },
		select: {
			id: true,
			conversationId: true,
			content: true,
			createdAt: true,
			author: { select: { id: true, name: true, image: true } },
			attachments: {
				select: { id: true, url: true, type: true, width: true, height: true },
			},
		},
	});

	const nextCursor = rows.length > take ? rows[take].id : null;
	const messages = rows.slice(0, take).reverse(); // oldest -> newest

	return {
		ok: true,
		conversationId: conv.id,
		title,
		peers,
		messages,
		nextCursor,
	};
}

export async function getUnreadTotal() {
	const session = await auth();
	if (!session?.user?.id) return 0;
	const viewerId = session.user.id;

	const total = await prisma.message.count({
		where: {
			authorId: { not: viewerId },
			reads: { none: { userId: viewerId } },
			conversation: {
				OR: [
					{ participants: { some: { userId: viewerId } } },
					{ isPublic: true },
				],
			},
		},
	});

	return total;
}

export async function markConversationRead({ conversationId }) {
	const session = await auth();
	const userId = session?.user?.id;
	if (!userId) return { ok: false, error: "Unauthorized" };
	if (!conversationId) return { ok: false, error: "Missing conversationId" };

	// quick membership/public guard (optional but nice)
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
	if (!conv) return { ok: false, error: "Not found" };
	const isMember = conv.participants.some(
		(p) => p.userId === userId && p.status === "JOINED"
	);
	if (!conv.isPublic && !isMember) return { ok: false, error: "Forbidden" };

	// Find unread message ids (authored by others)
	const unread = await prisma.message.findMany({
		where: {
			conversationId,
			authorId: { not: userId },
			reads: { none: { userId } },
		},
		select: { id: true },
		take: 1000, // safety cap; adjust if you want bigger batches
	});

	if (!unread.length) return { ok: true, count: 0 };

	await prisma.messageRead.createMany({
		data: unread.map((m) => ({ messageId: m.id, userId })),
		skipDuplicates: true,
	});

	return { ok: true, count: unread.length };
}
