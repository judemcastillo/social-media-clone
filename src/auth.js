// src/auth.js
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { dicebearAvatar } from "@/lib/avatar";

export const { handlers, auth, signIn, signOut } = NextAuth({
	adapter: PrismaAdapter(prisma),
	session: { strategy: "jwt" },
	providers: [
		GitHub({
			clientId: process.env.AUTH_GITHUB_ID,
			clientSecret: process.env.AUTH_GITHUB_SECRET,
		}),
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			async authorize(creds) {
				if (!creds?.email || !creds?.password) return null;
				const email = creds.email.toLowerCase();
				const user = await prisma.user.findUnique({
					where: { email },
					include: { Credential: true },
				});
				if (!user?.Credential) return null;
				const ok = await bcrypt.compare(
					creds.password,
					user.Credential.passwordHash
				);
				if (!ok) return null;
				return {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
					role: user.role,
					
				};
			},
		}),
	],

	callbacks: {
		async jwt({ token, user }) {
			if (user?.role) token.role = user.role;
			if (user?.id) token.sub = user.id;
			return token;
		},
		async session({ session, token }) {
			if (session?.user) {
				session.user.id = token.sub;
				session.user.role = token.role || "USER";
			}
			return session;
		},
	},

	/** NEW: set a random avatar for any newly created user */
	events: {
		async createUser({ user }) {
			try {
				if (!user?.id) return;
				// Set avatar only if it's missing
				if (!user.image) {
					await prisma.user.update({
						where: { id: user.id },
						data: { image: dicebearAvatar(user.id) },
					});
				}
			} catch (e) {
				console.error("createUser avatar event error", e);
			}
		},
	},
});
