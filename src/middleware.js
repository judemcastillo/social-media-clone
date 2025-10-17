// middleware.js (or middleware.ts)
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const protectedRoutes = ["/discover", "/home", "/messages", "/user", "/post","/search"];

export default async function middleware(request) {
	const session = await auth();
	const { pathname } = request.nextUrl;

	// Signed-in users hitting "/" go to /home
	if (pathname === "/" && session?.user) {
		return NextResponse.redirect(new URL("/home", request.url));
	}
	if (pathname === "/register" && session?.user) {
		return NextResponse.redirect(new URL("/home", request.url));
	}

	// Block unauthenticated access to protected routes
	const isProtectedRoute = protectedRoutes.some((route) =>
		pathname.startsWith(route)
	);
	if (isProtectedRoute && !session?.user) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/", // root (for redirect when signed in)
		"/discover/:path*", // protected
		"/home/:path*", // protected
		"/messages/:path*", // protected
		"/user/:path*", // protected (covers /user/[id], /user/[id]/edit, etc.)
		"/post/:path*", // protected (covers /post/[id], /post/[id]/edit, etc.)
		"/register/:path*", // public
		"/search/:path*", // protected
	],
};
