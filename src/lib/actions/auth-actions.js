// src/lib/actions/auth.js
"use server";

import { signIn, signOut } from "@/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { randomUUID } from "node:crypto";
import { dicebearAvatar } from "../avatar";

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
});

const registerSchema = z.object({
	name: z.string().min(2).max(50),
	email: z.string().email(),
	password: z.string().min(6),
});

export async function loginWithCredentials(_prev, formData) {
	const parsed = loginSchema.safeParse(Object.fromEntries(formData));
	if (!parsed.success)
		return { ok: false, errors: parsed.error.flatten().fieldErrors };

	const email = parsed.data.email.toLowerCase();
	const password = parsed.data.password;

	try {
		await signIn("credentials", { email, password, redirect: false });
	} catch (e) {
		if (e instanceof AuthError && e.type === "CredentialsSignin") {
			return { ok: false, errors: { _form: ["Invalid email or password."] } };
		}
		// unknown error
		return { ok: false, errors: { _form: ["Something went wrong."] } };
	}

	redirect("/home");
}

export async function register(_prev, formData) {
	const parsed = registerSchema.safeParse(Object.fromEntries(formData));
	if (!parsed.success)
		return { ok: false, errors: parsed.error.flatten().fieldErrors };

	const email = parsed.data.email.toLowerCase();
	const name = parsed.data.name.trim();
	const password = parsed.data.password;

	const exists = await prisma.user.findUnique({ where: { email } });
	if (exists) return { ok: false, errors: { email: ["Email already in use"] } };

	try {
		const passwordHash = await bcrypt.hash(password, 10);
		await prisma.user.create({
			data: {
				email,
				name,
				image: dicebearAvatar(email),
				role: "USER",
				Credential: { create: { passwordHash } },
			},
		});
	} catch (e) {
		console.error(e);
		return {
			ok: false,
			errors: { _form: ["Something went wrong. Please try again."] },
		};
	}

	const res = await signIn("credentials", { email, password, redirect: false });
	if (res?.error) {
		return {
			ok: false,
			errors: { _form: ["Account created. Please sign in."] },
		};
	}
	redirect("/home");
}

export async function loginWithGitHub() {
	// if you call this from a client button, you can let NextAuth redirect
	// but to be consistent you can also do redirect: false and manual redirect
	await signIn("github", { redirectTo: "/home" });
}

export async function logout() {
	await signOut({ redirectTo: "/" });
}

export async function signInAsGuestAction() {
	// Create a disposable guest account
	const email = `guest+${randomUUID()}@guest.local`;
	const password = randomUUID(); // random secret just for this account
	const passwordHash = await bcrypt.hash(password, 10);

	// Create user first to get id, then set avatar from id
	const user = await prisma.user.create({
		data: {
			email,
			name: `Guest ${Math.floor(1000 + Math.random() * 9000)}`,
			role: "GUEST",
			image: "", // temporary; event will also set it, but we set explicitly below too
		},
	});

	await prisma.credential.create({
		data: { userId: user.id, passwordHash },
	});

	// Ensure avatar exists even if the event is delayed
	await prisma.user.update({
		where: { id: user.id },
		data: { image: dicebearAvatar(user.id) },
	});

	// Log in this user using the credentials provider
	// NextAuth v5: signIn in a server action can redirect
	await signIn("credentials", {
		email,
		password,
		redirectTo: "/home",
	});

	return { ok: true }; // (won't be reached if redirected)
}
