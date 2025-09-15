// src/auth.js
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
	providers: [
		GitHub({
			clientId: process.env.AUTH_GITHUB_ID,
			clientSecret: process.env.AUTH_GITHUB_SECRET,
		}),
	],
	adapter: PrismaAdapter(prisma),
	session: { strategy: "jwt" },
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
