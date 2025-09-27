import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req, { params: p }) {
	const params = await p;
	try {
		const { id } = await params;
		if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

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

		if (!user)
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		return NextResponse.json({ user });
	} catch (e) {
		console.error("GET /api/user/[id] error:", e);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}
