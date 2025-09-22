// src/app/api/posts/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(req) {
	const session = await auth();
	const viewerId = session?.user?.id ?? null;

	const { searchParams } = new URL(req.url);
	const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
	const cursor = searchParams.get("cursor");

	const rows = await prisma.post.findMany({
		take: limit + 1,
		...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
		orderBy: { id: "desc" },
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
					bio: true,
					coverImageUrl: true,
					role: true,
					_count: { select: { followers: true, following: true } },
				},
			},
			_count: { select: { likes: true, comments: true } },
		},
	});

	let nextCursor = null;
	if (rows.length > limit) nextCursor = rows.pop().id;

	// likedByMe (batch)
	let likedMap = {};
	if (viewerId && rows.length) {
		const likes = await prisma.like.findMany({
			where: { userId: viewerId, postId: { in: rows.map((r) => r.id) } },
			select: { postId: true },
		});
		likedMap = Object.fromEntries(likes.map((l) => [l.postId, true]));
	}

	// follow flags (batch) for authors
	let isFollowing = new Set();
	let followsYou = new Set();
	if (viewerId && rows.length) {
		const authorIds = Array.from(
			new Set(rows.map((r) => r.authorId).filter((id) => id && id !== viewerId))
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

	const posts = rows.map((r) => ({
		...r,
		likedByMe: !!likedMap[r.id],
		author: {
			...r.author,
			isFollowedByMe: viewerId ? isFollowing.has(r.author.id) : false,
			followsMe: viewerId ? followsYou.has(r.author.id) : false,
		},
	}));

	return NextResponse.json({ posts, nextCursor });
}
