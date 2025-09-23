"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";

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
