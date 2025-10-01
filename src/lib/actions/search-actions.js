"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

const MAX_TAKE = 50;
const DEFAULT_YAPS_LIMIT = 20;
const DEFAULT_USERS_LIMIT = 24;

/** Internal helper: posts (yaps) page */
async function fetchYapsPage({
	q,
	limit = DEFAULT_YAPS_LIMIT,
	cursor = null,
	viewerId = null,
}) {
	const term = (q ?? "").trim();
	if (!term) return { ok: true, posts: [], nextCursor: null };

	const take = Math.min(Number(limit) || DEFAULT_YAPS_LIMIT, MAX_TAKE);

	const rows = await prisma.post.findMany({
		where: { content: { contains: term, mode: "insensitive" } },
		take: take + 1,
		...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			content: true,
			imageUrl: true,
			createdAt: true,
			authorId: true,
			author: {
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
			},
			_count: { select: { likes: true, comments: true } },
		},
	});

	const nextCursor = rows.length > take ? rows[take].id : null;
	const page = rows.slice(0, take);

	// likedByMe
	let likedMap = {};
	if (viewerId && page.length) {
		const likes = await prisma.like.findMany({
			where: { userId: viewerId, postId: { in: page.map((r) => r.id) } },
			select: { postId: true },
		});
		likedMap = Object.fromEntries(likes.map((l) => [l.postId, true]));
	}

	// follow flags for authors
	let isFollowing = new Set();
	let followsYou = new Set();
	if (viewerId && page.length) {
		const authorIds = Array.from(
			new Set(page.map((r) => r.authorId).filter((id) => id && id !== viewerId))
		);
		if (authorIds.length) {
			const edges = await prisma.follow.findMany({
				where: {
					OR: [
						{ followerId: viewerId, followingId: { in: authorIds } }, // me -> authors
						{ followerId: { in: authorIds }, followingId: viewerId }, // authors -> me
					],
				},
				select: { followerId: true, followingId: true },
			});
			isFollowing = new Set(
				edges.filter((e) => e.followerId === viewerId).map((e) => e.followingId)
			);
			followsYou = new Set(
				edges.filter((e) => e.followingId === viewerId).map((e) => e.followerId)
			);
		}
	}

	const posts = page.map((r) => ({
		...r,
		likedByMe: !!likedMap[r.id],
		author: {
			...r.author,
			isFollowedByMe: viewerId ? isFollowing.has(r.author.id) : false,
			followsMe: viewerId ? followsYou.has(r.author.id) : false,
		},
	}));

	return { ok: true, posts, nextCursor };
}

/** Internal helper: users page */
async function fetchUsersPage({
	q,
	limit = DEFAULT_USERS_LIMIT,
	cursor = null,
	viewerId = null,
}) {
	const term = (q ?? "").trim();
	if (!term) return { ok: true, users: [], nextCursor: null };

	const take = Math.min(Number(limit) || DEFAULT_USERS_LIMIT, MAX_TAKE);

	const rows = await prisma.user.findMany({
		where: {
			id: { not: viewerId || undefined },
			OR: [
				{ name: { contains: term, mode: "insensitive" } },
				{ email: { contains: term, mode: "insensitive" } },
				{ bio: { contains: term, mode: "insensitive" } },
			],
		},
		take: take + 1,
		...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
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

	// follow flags (me -> them, them -> me)
	let isFollowingSet = new Set();
	let followsMeSet = new Set();
	if (viewerId && page.length) {
		const ids = page.map((u) => u.id);
		const edges = await prisma.follow.findMany({
			where: {
				OR: [
					{ followerId: viewerId, followingId: { in: ids } },
					{ followerId: { in: ids }, followingId: viewerId },
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

/** Server-callable helpers for SSR usage in pages */
export async function fetchSearchYaps({
	q,
	limit = DEFAULT_YAPS_LIMIT,
	cursor = null,
} = {}) {
	const session = await auth();
	const viewerId = session?.user?.id ?? null;
	return fetchYapsPage({ q, limit, cursor, viewerId });
}

export async function fetchSearchUsers({
	q,
	limit = DEFAULT_USERS_LIMIT,
	cursor = null,
} = {}) {
	const session = await auth();
	const viewerId = session?.user?.id ?? null;
	return fetchUsersPage({ q, limit, cursor, viewerId });
}

/** Form-actions for client "Load more" buttons */
export async function searchYapsAction(_prev, formData) {
	const session = await auth();
	const viewerId = session?.user?.id ?? null;
	const q = String(formData.get("q") || "").trim();
	const cursor = formData.get("cursor") ? String(formData.get("cursor")) : null;
	const limit = Number(formData.get("limit") || DEFAULT_YAPS_LIMIT);
	return fetchYapsPage({ q, limit, cursor, viewerId });
}

export async function searchUsersAction(_prev, formData) {
	const session = await auth();
	const viewerId = session?.user?.id ?? null;
	const q = String(formData.get("q") || "").trim();
	const cursor = formData.get("cursor") ? String(formData.get("cursor")) : null;
	const limit = Number(formData.get("limit") || DEFAULT_USERS_LIMIT);
	return fetchUsersPage({ q, limit, cursor, viewerId });
}
