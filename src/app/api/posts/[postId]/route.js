// src/app/api/posts/[postId]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
	try {
		const { postId } = await params;
		if (!postId)
			return NextResponse.json({ error: "Missing postId" }, { status: 400 });

		const post = await prisma.post.findUnique({
			where: { id: postId },
			include: {
				author: { select: { id: true, name: true, image: true } },
				_count: { select: { likes: true, comments: true } },
			},
		});

		if (!post)
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		return NextResponse.json({ post });
	} catch (e) {
		console.error("GET /api/posts/[postId] error:", e);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}
