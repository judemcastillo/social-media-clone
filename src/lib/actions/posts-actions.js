"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const createSchema = z.object({ content: z.string().min(1).max(5000) });

export async function createPost(prev, formData) {
	const session = await auth();
	if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

	const parsed = createSchema.safeParse(Object.fromEntries(formData));
	if (!parsed.success) return { ok: false, error: "Yap something first." };

	const post = await prisma.post.create({
		data: { authorId: session.user.id, content: parsed.data.content.trim() },
		select: {
			id: true,
			content: true,
			createdAt: true,
			author: { select: { id: true, name: true, email: true, image: true } },
			_count: { select: { likes: true, comments: true } },
		},
	});

	// if your feed uses fetch/cache, you can revalidate
	revalidatePath("/home");
	return { ok: true, post };
}

export async function fetchFeed({ limit = 10, cursor = null } = {}) {
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
	return { items: rows, nextCursor };
}

// toggle like for the current user
export async function toggleLike(postId) {
	const session = await auth();
	if (!session?.user?.id) return { ok: false };

	const existing = await prisma.like.findUnique({
		where: { postId_userId: { postId, userId: session.user.id } },
	});

	if (existing) {
		await prisma.like.delete({ where: { id: existing.id } });
	} else {
		await prisma.like.create({ data: { postId, userId: session.user.id } });
	}

	// return new counts
	const counts = await prisma.post.findUnique({
		where: { id: postId },
		select: { _count: { select: { likes: true, comments: true } } },
	});
	return { ok: true, counts: counts?._count ?? { likes: 0, comments: 0 } };
}

// delete post (owner or ADMIN)
export async function deletePost(postId) {
	const session = await auth();
	if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

	const post = await prisma.post.findUnique({
		where: { id: postId },
		select: { authorId: true },
	});
	if (!post) return { ok: false, error: "Not found" };

	const isOwner = post.authorId === session.user.id;
	const isAdmin = session.user.role === "ADMIN";
	if (!isOwner && !isAdmin) return { ok: false, error: "Forbidden" };

	await prisma.post.delete({ where: { id: postId } });
	revalidatePath("/home");
	return { ok: true };
}
