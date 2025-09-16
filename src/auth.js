// src/auth.js
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

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
				if (creds === null) return null;
				try {
					const email = creds?.email.toLowerCase();
					const password = creds?.password || "";
					if (!email || !password) {
						throw new Error("Please input username and password");
					}
					const user = await prisma.user.findUnique({
						where: { email },
						include: { Credential: true },
					});
					if (!user || !user.Credential) {
						throw new Error("User not Found");
					} else {
						const isValid = await bcrypt.compare(
							password,
							user.Credential.passwordHash
						);
						if (!isValid) {
							throw new Error("Invalid username or password");
						} else {
							return {
								id: user.id,
								name: user.name,
								email: user.email,
								image: user.image,
								role: user.role,
							};
						}
					}
				} catch (err) {
					return null;
				}
			},
		}),
	],

	callbacks: {
		async jwt({ token, user }) {
			// when user logs in, persist their role to the token
			if (user?.role) token.role = user.role;
			if (user?.id) token.sub = user.id;
			return token;
		},
		async session({ session, token }) {
			// expose role + id on session.user
			if (session?.user) {
				session.user.id = token.sub;
				session.user.role = token.role || "USER";
			}
			return session;
		},
	},
});
