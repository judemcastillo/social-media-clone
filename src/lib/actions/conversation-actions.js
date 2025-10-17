// src/lib/actions/conversation-actions.js
"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { formatGroupTitle } from "@/lib/chat-title";

function requireUserId(session) {
	const id = session?.user?.id;
	if (!id) throw new Error("Unauthorized");
	const role = session?.user?.role || "USER";
	if (role === "GUEST") throw new Error("Guests cannot use chat");
	return id;
}

async function getParticipantList(conversationId) {
	const rows = await prisma.conversationParticipant.findMany({
		where: {
			conversationId,
			status: { not: "LEFT" },
		},
		orderBy: { joinedAt: "asc" },
		select: {
			role: true,
			status: true,
			joinedAt: true,
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
				},
			},
		},
	});

	return rows
		.map((p) => ({
			role: p.role,
			status: p.status,
			joinedAt: p.joinedAt,
			user: p.user,
		}))
		.filter((p) => p.user);
}

async function assertGroupAdmin(conversationId, viewerId) {
	const conv = await prisma.conversation.findUnique({
		where: { id: conversationId },
		select: {
			id: true,
			isGroup: true,
			isPublic: true,
			participants: {
				where: { userId: viewerId },
				select: {
					userId: true,
					role: true,
					status: true,
				},
			},
		},
	});

	if (!conv || !conv.isGroup || conv.isPublic) {
		throw new Error("Not a private group.");
	}
	const participant = conv.participants[0];
	if (!participant || participant.status === "LEFT") {
		throw new Error("Not a member.");
	}
	if (participant.role !== "ADMIN") {
		throw new Error("Admin only.");
	}
	return conv;
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

export async function leavePublicRoom({ conversationId }) {
	const session = await auth();
	const viewerId = requireUserId(session);
	if (!conversationId) return { ok: false, error: "Missing conversationId." };

	const conv = await prisma.conversation.findUnique({
		where: { id: conversationId },
		select: { isPublic: true },
	});
	if (!conv?.isPublic) {
		return { ok: false, error: "Not a public room." };
	}

	const participant = await prisma.conversationParticipant.findUnique({
		where: { conversationId_userId: { conversationId, userId: viewerId } },
		select: { status: true },
	});
	if (!participant || participant.status === "LEFT") {
		return { ok: false, error: "Not a member." };
	}

	await prisma.conversationParticipant.update({
		where: { conversationId_userId: { conversationId, userId: viewerId } },
		data: { status: "LEFT" },
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

export async function fetchFeaturedRooms() {
	const session = await auth();
	if (!session?.user?.id) return { rooms: [] };
	const viewerId = session.user.id;

	const featuredTitles = ["New Members", "Yappers4Life", "Exclusive Yappers"];
	const orderMap = new Map(featuredTitles.map((title, index) => [title, index]));

	const rooms = await prisma.conversation.findMany({
		where: {
			isPublic: true,
			title: { in: featuredTitles },
		},
		select: {
			id: true,
			title: true,
			createdAt: true,
			participants: {
				where: { userId: viewerId },
				select: { status: true },
			},
		},
	});

	const roomIds = rooms.map((room) => room.id);
	const memberCounts = roomIds.length
		? await prisma.conversationParticipant.groupBy({
				by: ["conversationId"],
				where: { conversationId: { in: roomIds }, status: "JOINED" },
				_count: { _all: true },
		  })
		: [];
	const messageCounts = roomIds.length
		? await prisma.message.groupBy({
				by: ["conversationId"],
				where: { conversationId: { in: roomIds } },
				_count: { _all: true },
		  })
		: [];

	const memberMap = new Map(
		memberCounts.map((entry) => [entry.conversationId, entry._count._all])
	);
	const messageMap = new Map(
		messageCounts.map((entry) => [entry.conversationId, entry._count._all])
	);

	const sorted = rooms
		.slice()
		.sort((a, b) => {
			const aIdx = orderMap.get(a.title ?? "") ?? Number.MAX_SAFE_INTEGER;
			const bIdx = orderMap.get(b.title ?? "") ?? Number.MAX_SAFE_INTEGER;
			return aIdx - bIdx;
		})
		.map((room) => ({
			id: room.id,
			title: room.title,
			createdAt: room.createdAt,
			memberCount: memberMap.get(room.id) ?? 0,
			messageCount: messageMap.get(room.id) ?? 0,
			viewerStatus: room.participants?.[0]?.status ?? null,
		}));

	return { rooms: sorted };
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
	let peers = [];
	let membership = null;
	let participants = [];

	if (kind === "group") {
		conv = await prisma.conversation.findUnique({
			where: { id },
			select: {
				id: true,
				title: true,
				isPublic: true,
				isGroup: true,
				participants: {
					where: { status: { not: "LEFT" } },
					select: {
						role: true,
						status: true,
						joinedAt: true,
						user: {
							select: { id: true, name: true, image: true, email: true },
						},
					},
				},
			},
		});
		if (!conv || !conv.isGroup) return { ok: false, error: "Not a group." };
		membership = await prisma.conversationParticipant.findUnique({
			where: { conversationId_userId: { conversationId: id, userId: viewerId } },
			select: { status: true },
		});
		if (!conv.isPublic && !membership) {
			return { ok: false, error: "Forbidden." };
		}
		participants = (conv.participants || []).map((p) => ({
			user: p.user,
			role: p.role,
			status: p.status,
			joinedAt: p.joinedAt,
		}));
	} else if (kind === "room") {
		conv = await prisma.conversation.findUnique({
			where: { id },
			select: {
				id: true,
				title: true,
				isPublic: true,
				isGroup: true,
				participants: {
					where: { status: { not: "LEFT" } },
					select: {
						role: true,
						status: true,
						joinedAt: true,
						user: {
							select: { id: true, name: true, image: true, email: true },
						},
					},
				},
			},
		});
		if (!conv || !conv.isPublic) return { ok: false, error: "Not a room." };
		participants = (conv.participants || []).map((p) => ({
			user: p.user,
			role: p.role,
			status: p.status,
			joinedAt: p.joinedAt,
		}));
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
					where: { status: { not: "LEFT" } },
					select: {
						role: true,
						status: true,
						joinedAt: true,
						user: {
							select: { id: true, name: true, image: true, email: true },
						},
					},
				},
			},
		});
		participants = (conv?.participants || []).map((p) => ({
			user: p.user,
			role: p.role,
			status: p.status,
			joinedAt: p.joinedAt,
		}));
	}

	peers = participants.map((p) => p.user).filter(Boolean);
	if (!conv.isGroup && !conv.isPublic) {
		peers = peers.filter((u) => u?.id !== viewerId);
	}

	let title = conv.title || "";
	if (!title) {
		if (conv.isPublic) {
			title = "Room";
		} else if (conv.isGroup) {
			title = formatGroupTitle({
				participants: peers,
				viewerId,
				maxNames: 3,
				fallback: "Conversation",
			});
		} else {
			const others = peers.filter((u) => u.id !== viewerId);
			title = others.length ? others[0].name || "User" : "Conversation";
		}
	}

	if (conv.isGroup && !conv.isPublic) {
		if (!membership) {
			membership = await prisma.conversationParticipant.findUnique({
				where: {
					conversationId_userId: { conversationId: conv.id, userId: viewerId },
				},
				select: { status: true },
			});
		}
		if (!membership) return { ok: false, error: "Forbidden." };
		if (membership.status !== "JOINED") {
			await prisma.conversationParticipant.update({
				where: {
					conversationId_userId: {
						conversationId: conv.id,
						userId: viewerId,
					},
				},
				data: { status: "JOINED" },
			});
		}
	}

	const viewerParticipant =
		participants.find((p) => p.user?.id === viewerId) || null;
	if (!membership && viewerParticipant) {
		membership = { status: viewerParticipant.status };
	}
	const viewerRole = viewerParticipant?.role ?? null;
	const viewerStatus = viewerParticipant?.status ?? null;

	let cursorMessage = null;
	if (cursor) {
		cursorMessage = await prisma.message.findUnique({
			where: { id: cursor },
			select: { id: true, createdAt: true },
		});
		if (!cursorMessage) cursor = null;
	}

	// Messages (newest -> oldest by createdAt, then reverse for display)
	const rows = await prisma.message.findMany({
		where: {
			conversationId: conv.id,
			...(cursorMessage
				? {
						OR: [
							{ createdAt: { lt: cursorMessage.createdAt } },
							{
								createdAt: cursorMessage.createdAt,
								id: { lt: cursorMessage.id },
							},
						],
				  }
				: {}),
		},
		take: take + 1,
		orderBy: [
			{ createdAt: "desc" },
			{ id: "desc" },
		],
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

	const hasMore = rows.length > take;
	const pageRows = rows.slice(0, take);
	const messages = pageRows.reverse(); // oldest -> newest for UI
	const nextCursor =
		hasMore && messages.length ? messages[0]?.id ?? null : null;

	return {
		ok: true,
		conversationId: conv.id,
		title,
		peers,
		participants,
		viewerRole,
		viewerStatus,
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

export async function addGroupMembers({ conversationId, memberIds = [] }) {
	const session = await auth();
	const viewerId = requireUserId(session);
	if (!conversationId) return { ok: false, error: "Missing conversationId." };

	try {
		await assertGroupAdmin(conversationId, viewerId);
	} catch (err) {
		return { ok: false, error: err?.message || "Forbidden." };
	}

	const unique = Array.from(
		new Set(
			memberIds
				.filter((id) => id && id !== viewerId)
				.map((id) => id.trim())
				.filter(Boolean)
		)
	);
	if (!unique.length) {
		return { ok: false, error: "Select at least one member." };
	}

	const users = await prisma.user.findMany({
		where: { id: { in: unique }, role: { not: "GUEST" } },
		select: { id: true },
	});
	const validIds = users.map((u) => u.id);
	if (!validIds.length) {
		return { ok: false, error: "No eligible members to add." };
	}

	await prisma.$transaction(
		validIds.map((memberId) =>
			prisma.conversationParticipant.upsert({
				where: {
					conversationId_userId: { conversationId, userId: memberId },
				},
				create: {
					conversationId,
					userId: memberId,
					status: "INVITED",
					role: "MEMBER",
					invitedById: viewerId,
				},
				update: {
					status: "INVITED",
					invitedById: viewerId,
				},
			})
		)
	);

	const participants = await getParticipantList(conversationId);
	return {
		ok: true,
		participants,
		viewerRole: "ADMIN",
		viewerStatus: "JOINED",
	};
}

export async function removeGroupMember({ conversationId, memberId }) {
	const session = await auth();
	const viewerId = requireUserId(session);
	if (!conversationId || !memberId)
		return { ok: false, error: "Missing ids." };
	if (memberId === viewerId)
		return { ok: false, error: "Use leave group instead." };

	try {
		await assertGroupAdmin(conversationId, viewerId);
	} catch (err) {
		return { ok: false, error: err?.message || "Forbidden." };
	}

	const target = await prisma.conversationParticipant.findUnique({
		where: { conversationId_userId: { conversationId, userId: memberId } },
		select: { role: true, status: true },
	});
	if (!target || target.status === "LEFT") {
		return { ok: false, error: "Member not found." };
	}
	if (target.role === "ADMIN") {
		return { ok: false, error: "Cannot remove another admin." };
	}

	await prisma.conversationParticipant.update({
		where: { conversationId_userId: { conversationId, userId: memberId } },
		data: { status: "LEFT" },
	});

	const participants = await getParticipantList(conversationId);
	return {
		ok: true,
		participants,
		viewerRole: "ADMIN",
		viewerStatus: "JOINED",
	};
}

export async function leaveGroup({ conversationId }) {
	const session = await auth();
	const viewerId = requireUserId(session);
	if (!conversationId) return { ok: false, error: "Missing conversationId." };

	const conv = await prisma.conversation.findUnique({
		where: { id: conversationId },
		select: {
			id: true,
			isGroup: true,
			isPublic: true,
			participants: {
				select: {
					userId: true,
					role: true,
					status: true,
					joinedAt: true,
				},
			},
		},
	});
	if (!conv || !conv.isGroup || conv.isPublic) {
		return { ok: false, error: "Not a private group." };
	}

	const viewerParticipant = conv.participants.find(
		(p) => p.userId === viewerId
	);
	if (!viewerParticipant || viewerParticipant.status === "LEFT") {
		return { ok: false, error: "Not a member." };
	}

	const joinedOthers = conv.participants.filter(
		(p) => p.userId !== viewerId && p.status === "JOINED"
	);
	const otherAdmins = joinedOthers.filter((p) => p.role === "ADMIN");

	await prisma.$transaction(async (tx) => {
		if (
			viewerParticipant.role === "ADMIN" &&
			otherAdmins.length === 0 &&
			joinedOthers.length > 0
		) {
			const promote = joinedOthers.sort(
				(a, b) => a.joinedAt.getTime() - b.joinedAt.getTime()
			)[0];
			await tx.conversationParticipant.update({
				where: {
					conversationId_userId: {
						conversationId,
						userId: promote.userId,
					},
				},
				data: { role: "ADMIN" },
			});
		}

		await tx.conversationParticipant.update({
			where: {
				conversationId_userId: { conversationId, userId: viewerId },
			},
			data: { status: "LEFT" },
		});
	});

	return { ok: true };
}
