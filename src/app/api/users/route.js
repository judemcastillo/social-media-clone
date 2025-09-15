// src/app/api/users/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/users?query=alice&limit=10&cursor=<id>
export async function GET(request) {
	const { searchParams } = new URL(request.url);
	const query = searchParams.get("query")?.trim() || "";
	const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
	const cursor = searchParams.get("cursor");

	const where = query
		? {
				OR: [
					{ email: { contains: query, mode: "insensitive" } },
					{ name: { contains: query, mode: "insensitive" } },
				],
		  }
		: {};

	const users = await prisma.user.findMany({
		where,
		take: limit + 1, // fetch one extra to know if there is next page
		...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			email: true,
			name: true,
			image: true,
			role: true,
			createdAt: true,
		},
	});

	let nextCursor = null;
	if (users.length > limit) {
		const nextItem = users.pop();
		nextCursor = nextItem.id;
	}

	return NextResponse.json({ items: users, nextCursor });
}
