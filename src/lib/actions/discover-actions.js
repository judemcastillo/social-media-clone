// src/lib/actions/discover-actions.js
"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

const LIMIT = 12;

async function fetchDiscoverPage({
	viewerId,
	cursor = null,
	limit = LIMIT,
	q = "",
}) {
	const take = Math.min(Number(limit) || LIMIT, 50);

	const queryFilter = q
		? {
				OR: [
					{ name: { contains: q, mode: "insensitive" } },
					{ email: { contains: q, mode: "insensitive" } },
					{ bio: { contains: q, mode: "insensitive" } },
				],
		  }
		: {};

	const rows = await prisma.user.findMany({
		where: { id: { not: viewerId }, ...queryFilter },
		take: take + 1,
		...(cursor ? { cursor: { id: cursor } } : {}), // ✅ skip the cursor row
		orderBy: [
			{ followers: { _count: "desc" } },
			{ following: { _count: "desc" } },
			{ id: "desc" },
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

	const nextCursor = rows.length > take ? rows[take].id : null;
	const page = rows.slice(0, take);

	// follow flags relative to viewer
	let isFollowingSet = new Set();
	let followsMeSet = new Set();
	if (page.length) {
		const ids = page.map((u) => u.id);
		const edges = await prisma.follow.findMany({
			where: {
				OR: [
					{ followerId: viewerId, followingId: { in: ids } }, // me -> them
					{ followerId: { in: ids }, followingId: viewerId }, // them -> me
				],
			},
			select: { followerId: true, followingId: true },
		});
		isFollowingSet = new Set(
			edges.filter((e) => e.followerId === viewerId).map((e) => e.followingId)
		);
		followsMeSet = new Set(
			edges.filter((e) => e.followingId === viewerId).map((e) => e.followerId)
		);
	}

	const users = page.map((u) => ({
		...u,
		isFollowedByMe: isFollowingSet.has(u.id),
		followsMe: followsMeSet.has(u.id),
	}));

	return { ok: true, users, nextCursor };
}

// Initial page (no query)
export async function fetchUsersAction({ cursor = null, limit = LIMIT } = {}) {
	const session = await auth();
	if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
	return fetchDiscoverPage({ viewerId: session.user.id, cursor, limit, q: "" });
}

// Search first page
export async function searchDiscoverAction(_prev, formData) {
	const session = await auth();
	if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
	const q = String(formData.get("q") || "").trim();
	return fetchDiscoverPage({
		viewerId: session.user.id,
		cursor: null,
		limit: LIMIT,
		q,
	});
}

// Load more for current query
export async function loadMoreDiscoverAction(_prev, formData) {
	const session = await auth();
	if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
	const cursor = formData.get("cursor") ? String(formData.get("cursor")) : null;
	const q = String(formData.get("q") || "").trim();
	return fetchDiscoverPage({
		viewerId: session.user.id,
		cursor,
		limit: LIMIT,
		q,
	});
}
export default async function fetchOneUserAction(id) {
	try {
		if (!id) return { error: "Missing id", status: 400 };
		const user = await prisma.user.findUnique({
			where: { id },
			select: {
				id: true,
				email: true,
				name: true,
				image: true,
				role: true,
				createdAt: true,
				coverImageUrl: true,
				bio: true,
				skills: true,
				_count: { select: { followers: true, following: true } },
			},
		});
		if (!user) return { error: "Not found", status: 404 };
		return { user };
	} catch (e) {
		console.error(e);
		return { error: "Server error", status: 500 };
	}
}
