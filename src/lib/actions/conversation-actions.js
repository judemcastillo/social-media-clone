// src/lib/actions/conversation-actions.js
"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { requireNonGuest } from "./_auth-guards";

function requireUserId(session) {
	const id = session?.user?.id;
	if (!id) throw new Error("Unauthorized");
	return id;
}

export async function getOrCreateDM(viewerId, otherUserId) {
	if (!otherUserId) throw new Error("Missing user id");
	if (viewerId === otherUserId) throw new Error("Cannot DM yourself");

	// DMs are: isGroup=false, isPublic=false and have both participants
	const existing = await prisma.conversation.findFirst({
		where: {
			isGroup: false,
			isPublic: false,
			participants: { some: { userId: viewerId } },
			AND: { participants: { some: { userId: otherUserId } } },
		},
		select: { id: true, isGroup: true, isPublic: true },
	});
	if (existing) {
	
		return existing;
	}

	// race-safe create
	try {
		const res = await prisma.conversation.create({
			data: {
				isGroup: false,
				isPublic: false,
				createdById: viewerId,
				participants: {
					create: [
						{ userId: viewerId, status: "JOINED", role: "MEMBER" },
						{ userId: otherUserId, status: "JOINED", role: "MEMBER" },
					],
				},
			},
			select: { id: true, isGroup: true, isPublic: true },
		});
		return res;
	} catch (e) {
		const again = await prisma.conversation.findFirst({
			where: {
				isGroup: false,
				isPublic: false,
				participants: { some: { userId: viewerId } },
				AND: { participants: { some: { userId: otherUserId } } },
			},
			select: { id: true, isGroup: true, isPublic: true },
		});
		if (again) return again;
		throw e;
	}
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
	const me = requireUserId(session);

	const data = await prisma.conversation.findMany({
		where: { participants: { some: { userId: me, status: "JOINED" } } },
		orderBy: { updatedAt: "desc" },
		select: {
			id: true,
			isGroup: true,
			isPublic: true,
			title: true,
			participants: {
				where: { userId: { not: me }, status: "JOINED" },
				select: { user: { select: { id: true, name: true, image: true } } },
				take: 3,
			},
			messages: {
				orderBy: { createdAt: "desc" },
				take: 1,
				select: {
					id: true,
					content: true,
					createdAt: true,
					author: { select: { id: true, name: true } },
					attachments: { select: { id: true, type: true } },
				},
			},
		},
	});

	return { ok: true, conversations: data };
}

export async function fetchMessagesPage({
	targetUserId = null,
	conversationId = null,
	cursor = null,
	limit = 30,
} = {}) {
	const { userId: viewerId } = await requireNonGuest();
	const take = Math.min(Number(limit) || 30, 100);

	let conv = null;

	if (conversationId) {
		// explicit conversation id path
		conv = await prisma.conversation.findUnique({
			where: { id: String(conversationId) },
			select: { id: true, isPublic: true },
		});
		if (!conv) throw new Error("Not found");
	} else if (targetUserId) {
		// DM path (this is what /messages/[id] is currently using)
		conv = await getOrCreateDM(viewerId, String(targetUserId));
	} else {
		throw new Error("Missing identifier");
	}

	// private membership guard
	if (!conv.isPublic) {
		const member = await prisma.conversationParticipant.findUnique({
			where: {
				conversationId_userId: { conversationId: conv.id, userId: viewerId },
			},
			select: { status: true },
		});
		if (!(member && member.status === "JOINED")) throw new Error("Forbidden");
	}

	const rows = await prisma.message.findMany({
		where: { conversationId: conv.id },
		take: take + 1,
		...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
		orderBy: { id: "desc" }, // newest first; flip if your UI wants oldest first
		select: {
			id: true,
			content: true,
			createdAt: true,
			authorId: true,
			author: { select: { id: true, name: true, image: true } },
			attachments: { select: { id: true, url: true, type: true } },
		},
	});

	let nextCursor = null;
	if (rows.length > take) nextCursor = rows.pop().id;

	return {
		ok: true,
		conversationId: conv.id,
		messages: rows, // or rows.reverse()
		nextCursor,
	};
}
