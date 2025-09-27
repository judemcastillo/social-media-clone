// src/app/api/posts/[postId]/comments/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req, { params: p }) {
	const params = await p;
	const { postId } = params;
	if (!postId) return NextResponse.json({ items: [], nextCursor: null });

	const { searchParams } = new URL(req.url);
	const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
	const cursor = searchParams.get("cursor");

	const rows = await prisma.comment.findMany({
		where: { postId },
		take: limit + 1,
		...(cursor ? { cursor: { id: cursor } } : {}),
		orderBy: { id: "desc" }, // stable seek pagination
		select: {
			id: true,
			content: true,
			createdAt: true,
			postId: true,
			author: { select: { id: true, name: true, email: true, image: true } },
		},
	});

	let nextCursor = null;
	if (rows.length > limit) nextCursor = rows.pop().id;

	return NextResponse.json({ items: rows, nextCursor });
}
