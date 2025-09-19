"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const updateSchema = z.object({
	postId: z.string().min(1),
	content: z.string().min(1).max(5000),
});
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
export async function toggleLike(_prev, formData) {
	const session = await auth();
	if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

	const postId = formData.get("postId");
	if (!postId) return { ok: false, error: "Missing postId" };
	const userId = session.user.id;

	const where = { postId_userId: { postId, userId } };

	try {
		const existing = await prisma.like.findUnique({ where });
		if (existing) {
			await prisma.like.delete({ where });
			return { ok: true, liked: false };
		} else {
			await prisma.like.create({ data: { userId: session.user.id, postId } });
			return { ok: true, liked: true };
		}
	} catch (e) {
		console.error(e);
		return { ok: false, error: "Failed to toggle like" };
	} finally {
		revalidatePath("/home"); // helps any server-rendered bits
	}
}

// delete post (owner or ADMIN)
export async function deletePostAction(prevState, formData) {
	const session = await auth();
	if (!session?.user?.id) {
		return { ok: false, error: "Unauthorized" };
	}

	const postId = formData.get("postId");
	if (!postId) return { ok: false, error: "Missing post id" };

	// owner or ADMIN
	const post = await prisma.post.findUnique({
		where: { id: postId },
		select: { authorId: true },
	});
	if (!post) return { ok: false, error: "Not found" };

	const isOwner = post.authorId === session.user.id;
	const isAdmin = session.user.role === "ADMIN";
	if (!isOwner && !isAdmin) return { ok: false, error: "Forbidden" };

	await prisma.post.delete({ where: { id: postId } });
	revalidatePath("/home"); // refresh any server-rendered feeds

	return { ok: true };
}

// ADD COMMENT
export async function addComment(prev, formData) {
	const session = await auth();
	if (!session?.user) return { ok: false, error: "Unauthorized" };

	const postId = formData.get("postId");
	const content = (formData.get("content") || "").toString().trim();

	if (!postId || !content) return { ok: false, error: "Missing fields" };

	try {
		const comment = await prisma.comment.create({
			data: {
				postId,
				authorId: session.user.id,
				content,
			},
			select: {
				id: true,
				content: true,
				createdAt: true,
				author: { select: { id: true, name: true, email: true, image: true } },
				postId: true,
			},
		});
		return { ok: true, comment };
	} catch (e) {
		console.error(e);
		return { ok: false, error: "Failed to comment" };
	} finally {
		revalidatePath("/home");
	}
}

// DELETE COMMENT (owner or admin)
export async function deleteComment(prev, formData) {
	const session = await auth();
	if (!session?.user) return { ok: false, error: "Unauthorized" };

	const id = formData.get("commentId");
	if (!id) return { ok: false, error: "Missing commentId" };

	const comment = await prisma.comment.findUnique({
		where: { id },
		select: { authorId: true },
	});
	if (!comment) return { ok: false, error: "Not found" };

	const isOwner = comment.authorId === session.user.id;
	const isAdmin = session.user.role === "ADMIN";
	if (!isOwner && !isAdmin) return { ok: false, error: "Forbidden" };

	try {
		await prisma.comment.delete({ where: { id } });
		return { ok: true };
	} catch (e) {
		console.error(e);
		return { ok: false, error: "Delete failed" };
	} finally {
		revalidatePath("/home");
	}
}

export async function updatePostAction(prev, formData) {
	const session = await auth();

	if (!session?.user?.id) {
		return { ok: false, error: "Unauthorized" };
	}

	const parsed = updateSchema.safeParse(Object.fromEntries(formData));
	if (!parsed.success) {
		return { ok: false, error: "Say something first." };
	}

	const post = await prisma.post.findUnique({
		where: { id: parsed.data.postId },
		select: { authorId: true },
	});

	if (!post) {
		return { ok: false, error: "Not found" };
	}

	const isOwner = post.authorId === session.user.id;
	const isAdmin = session.user.role === "ADMIN";

	if (!isOwner && !isAdmin) {
		return { ok: false, error: "Forbidden" };
	}

	const updated = await prisma.post.update({
		where: { id: parsed.data.postId },
		data: { content: parsed.data.content.trim() },
		select: {
			id: true,
			content: true,
			createdAt: true,
			author: { select: { id: true, name: true, email: true, image: true } },
			_count: { select: { likes: true, comments: true } },
		},
	});

	revalidatePath("/home");

	return { ok: true, post: updated };
}
