// src/app/api/posts/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req) {
	const session = await auth();
	const userId = session?.user?.id ?? null;

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
			createdAt: true,
			author: { select: { id: true, name: true, email: true, image: true } },
			_count: { select: { likes: true, comments: true } },
		},
	});

	let nextCursor = null;
	if (rows.length > limit) nextCursor = rows.pop().id;

	// optional likedByMe (keep if using likes)
	let likedMap = {};
	if (userId && rows.length) {
		const likes = await prisma.like.findMany({
			where: { userId, postId: { in: rows.map((r) => r.id) } },
			select: { postId: true },
		});
		likedMap = Object.fromEntries(likes.map((l) => [l.postId, true]));
	}

	const posts = rows.map((r) => ({ ...r, likedByMe: !!likedMap[r.id] }));
	return NextResponse.json({ posts, nextCursor }); // <<< shape
}
