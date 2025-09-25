"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

const LIMIT = 12;

export async function loadMoreDiscoverAction(prev, formData) {
	const session = await auth();
	const viewerId = session?.user?.id ?? null;
	const cursor = String(formData.get("cursor") || "") || null;

	const rows = await prisma.user.findMany({
		where: { id: { not: viewerId } },
		take: LIMIT + 1,
		...(cursor ? { cursor: { id: cursor } } : {}),
		orderBy: [
			{ followers: { _count: "desc" } }, // most followers
			{ following: { _count: "desc" } }, // then following count
			{ id: "desc" }, // stable tie-break for cursor paging
		],
		select: {
			id: true,
			name: true,
			email: true,
			image: true,
			role: true,
			bio: true,
			coverImageUrl: true,
			_count: { select: { followers: true, following: true } },
		},
	});

	let nextCursor = null;
	if (rows.length > LIMIT) nextCursor = rows[rows.length - 1].id;
	const users = rows.slice(0, LIMIT);

	// follow flags relative to viewer (batch)
	let followSet = new Set();
	let backSet = new Set();
	if (viewerId && users.length) {
		const ids = users.map((u) => u.id);
		const edges = await prisma.follow.findMany({
			where: {
				OR: [
					{ followerId: viewerId, followingId: { in: ids } },
					{ followerId: { in: ids }, followingId: viewerId },
				],
			},
			select: { followerId: true, followingId: true },
		});
		followSet = new Set(
			edges.filter((e) => e.followerId === viewerId).map((e) => e.followingId)
		);
		backSet = new Set(
			edges.filter((e) => e.followingId === viewerId).map((e) => e.followerId)
		);
	}

	const withFlags = users.map((u) => ({
		...u,
		isFollowedByMe: followSet.has(u.id),
		followsMe: backSet.has(u.id),
	}));

	return { ok: true, users: withFlags, nextCursor };
}
