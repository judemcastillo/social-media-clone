import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req, { params }) {
	const post = await prisma.post.findUnique({
		where: { id: params.id },
		select: {
			id: true,
			content: true,
			createdAt: true,
			author: { select: { id: true, name: true, email: true, image: true } },
			_count: { select: { likes: true, comments: true } },
		},
	});

	if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
	return NextResponse.json(post);
}
