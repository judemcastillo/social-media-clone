"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { fetchUserFeed } from "./posts-actions";

const BUCKET = process.env.SUPABASE_BUCKET || "posts";

export async function updateProfileWithUploadsAction(prev, formData) {
	const session = await auth();
	const me = session?.user?.id;
	const role = session?.user?.role;

	if (!me) return { ok: false, error: "Unauthorized" };
	if (role === "GUEST")
		return { ok: false, error: "Guest accounts cannot edit profile." };

	const name = (formData.get("name") || "").toString().trim();
	const bio = (formData.get("bio") || "").toString().trim();
	const skillsRaw = (formData.get("skills") || "").toString();
	const avatar = formData.get("avatar"); // File or null
	const cover = formData.get("cover"); // File or null

	const data = {};
	if (name) data.name = name;
	if (bio || bio === "") data.bio = bio;
	if (skillsRaw)
		data.skills = skillsRaw
			.split(/[,|\n]/)
			.map((s) => s.trim())
			.filter(Boolean);

	async function maybeUpload(file, folder) {
		if (
			!file ||
			typeof file !== "object" ||
			!("size" in file) ||
			file.size === 0
		)
			return null;
		const ext = (file.name?.split(".").pop() || "jpg")
			.toLowerCase()
			.replace(/[^a-z0-9]/g, "");
		const path = `${folder}/${me}/${randomUUID()}.${ext}`;
		const buffer = Buffer.from(await file.arrayBuffer());
		const { error } = await supabaseAdmin.storage
			.from(BUCKET)
			.upload(path, buffer, {
				upsert: false,
				contentType: file.type || "image/jpeg",
			});
		if (error) throw error;
		const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
		return data?.publicUrl || null;
	}

	try {
		const [imageUrl, coverUrl] = await Promise.all([
			maybeUpload(avatar, "avatars"),
			maybeUpload(cover, "covers"),
		]);

		if (imageUrl) data.image = imageUrl;
		if (coverUrl) data.coverImageUrl = coverUrl;

		await prisma.user.update({ where: { id: me }, data });

		revalidatePath(`/user/${me}`);
		return { ok: true };
	} catch (e) {
		console.error("updateProfileWithUploadsAction", e);
		return { ok: false, error: "Save failed" };
	}
}

export async function fetchFollowersPage({
	userId,
	limit = 12,
	cursor = null,
} = {}) {
	const session = await auth();
	if (!session?.user) return { ok: false, error: "Unauthorized" };
	if (!userId) return { ok: false, error: "userId is required" };

	const viewerId = session.user.id;
	const take = Math.min(Number(limit) || 12, 50);

	const where = { followingId: userId };

	const edges = await prisma.follow.findMany({
		where,
		take: take + 1,
		...(cursor
			? {
					cursor: {
						followerId_followingId: { followerId: cursor, followingId: userId },
					},
			  }
			: {}),
		orderBy: { followerId: "asc" }, // deterministic order compatible with cursor
		select: {
			follower: {
				select: { id: true, name: true, email: true, image: true, role: true },
			},
		},
	});

	let nextCursor = null;
	if (edges.length > take) nextCursor = edges.pop().follower.id;

	const users = edges.map((e) => e.follower);

	// follow flags relative to viewer
	if (viewerId) {
		const ids = users.map((u) => u.id).filter((x) => x !== viewerId);
		if (ids.length) {
			const rels = await prisma.follow.findMany({
				where: {
					OR: [
						{ followerId: viewerId, followingId: { in: ids } }, // me -> them
						{ followerId: { in: ids }, followingId: viewerId }, // them -> me
					],
				},
				select: { followerId: true, followingId: true },
			});
			const iFollow = new Set(
				rels.filter((r) => r.followerId === viewerId).map((r) => r.followingId)
			);
			const followsMe = new Set(
				rels.filter((r) => r.followingId === viewerId).map((r) => r.followerId)
			);
			for (const u of users) {
				u.isFollowedByMe = iFollow.has(u.id);
				u.followsMe = followsMe.has(u.id);
			}
		} else {
			for (const u of users) {
				u.isFollowedByMe = false;
				u.followsMe = false;
			}
		}
	}

	return { ok: true, items: users, nextCursor };
}

/**
 * Users that `userId` is following
 * Cursor is the last following's `followingId` (string) or null.
 */
export async function fetchFollowingPage({
	userId,
	limit = 12,
	cursor = null,
} = {}) {
	const session = await auth();
	if (!session?.user) return { ok: false, error: "Unauthorized" };
	if (!userId) return { ok: false, error: "userId is required" };

	const viewerId = session.user.id;
	const take = Math.min(Number(limit) || 12, 50);

	const where = { followerId: userId };

	const edges = await prisma.follow.findMany({
		where,
		take: take + 1,
		...(cursor
			? {
					cursor: {
						followerId_followingId: { followerId: userId, followingId: cursor },
					},
			  }
			: {}),
		orderBy: { followingId: "asc" }, // deterministic order compatible with cursor
		select: {
			following: {
				select: { id: true, name: true, email: true, image: true, role: true },
			},
		},
	});

	let nextCursor = null;
	if (edges.length > take) nextCursor = edges.pop().following.id;

	const users = edges.map((e) => e.following);

	// follow flags relative to viewer
	if (viewerId) {
		const ids = users.map((u) => u.id).filter((x) => x !== viewerId);
		if (ids.length) {
			const rels = await prisma.follow.findMany({
				where: {
					OR: [
						{ followerId: viewerId, followingId: { in: ids } }, // me -> them
						{ followerId: { in: ids }, followingId: viewerId }, // them -> me
					],
				},
				select: { followerId: true, followingId: true },
			});
			const iFollow = new Set(
				rels.filter((r) => r.followerId === viewerId).map((r) => r.followingId)
			);
			const followsMe = new Set(
				rels.filter((r) => r.followingId === viewerId).map((r) => r.followerId)
			);
			for (const u of users) {
				u.isFollowedByMe = iFollow.has(u.id);
				u.followsMe = followsMe.has(u.id);
			}
		} else {
			for (const u of users) {
				u.isFollowedByMe = false;
				u.followsMe = false;
			}
		}
	}

	return { ok: true, items: users, nextCursor };
}
export async function loadMoreFollowersAction({ cursor = null, userId }) {
	if (!cursor) return { ok: true, status: "No more Users" };
	return fetchFollowersPage({ userId, limit: 12, cursor });
}
export async function loadMoreFollowingAction({ cursor = null, userId }) {
	if (!cursor) return { ok: true, status: "No more Users" };
	return fetchFollowingPage({ userId, limit: 12, cursor });
}

export async function loadMorePostsAction({ cursor = null, userId }) {
	if (!cursor) return { ok: true, status: "No more Yaps" };
	return fetchUserFeed({ userId, limit: 12, cursor });
}
