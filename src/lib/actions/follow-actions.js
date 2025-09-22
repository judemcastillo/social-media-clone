// src/lib/actions/follow-actions.js
"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function toggleFollowAction(prev, formData) {
	const session = await auth();
	const me = session?.user?.id;
	const myRole = session?.user?.role;
	const userId = String(formData.get("userId") || "");

	if (!me)
		return { ok: false, following: prev.following, error: "Unauthorized" };

	// Disallow if I am a guest or the target is a guest
	const target = await prisma.user.findUnique({
		where: { id: userId },
		select: { role: true },
	});
	if (myRole === "GUEST" || target?.role === "GUEST") {
		return {
			ok: false,
			following: prev.following,
			error: "Guests cannot follow",
		};
	}

	if (!userId || userId === me) {
		return { ok: false, following: prev.following, error: "Invalid target" };
	}

	const rm = await prisma.follow.deleteMany({
		where: { followerId: me, followingId: userId },
	});
	if (rm.count > 0) {
		revalidatePath("/home");
		revalidatePath(`/user/${userId}`);
		return { ok: true, following: false };
	}
	try {
		await prisma.follow.create({
			data: { followerId: me, followingId: userId },
		});
		revalidatePath("/home");
		revalidatePath(`/user/${userId}`);
		return { ok: true, following: true };
	} catch (e) {
		if (e?.code === "P2002") {
			revalidatePath("/home");
			revalidatePath(`/user/${userId}`);
			return { ok: true, following: true };
		}
		return { ok: false, following: prev.following, error: "Server error" };
	}
}
