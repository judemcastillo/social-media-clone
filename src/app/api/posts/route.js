import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
	const { searchParams } = new URL(request.url);
	const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
	const cursor = searchParams.get("cursor");

	const rows = await prisma.post.findMany({
		take: limit + 1,
		...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
		orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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
	return NextResponse.json({ posts: rows, nextCursor });
}
