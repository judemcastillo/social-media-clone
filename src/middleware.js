// middleware.js (or middleware.ts)
import { NextResponse } from "next/server";

const protectedRoutes = [
	"/discover",
	"/home",
	"/messages",
	"/user",
	"/post",
	"/search",
];

const sessionCookieNames = [
	"__Secure-authjs.session-token",
	"authjs.session-token",
	"__Secure-next-auth.session-token",
	"next-auth.session-token",
];

function hasSessionCookie(request) {
	return sessionCookieNames.some((name) => request.cookies.get(name));
}

export default async function middleware(request) {
	const { pathname } = request.nextUrl;
	const isAuthed = hasSessionCookie(request);

	// Signed-in users hitting "/" go to /home
	if (pathname === "/" && isAuthed) {
		return NextResponse.redirect(new URL("/home", request.url));
	}
	if (pathname === "/register" && isAuthed) {
		return NextResponse.redirect(new URL("/home", request.url));
	}

	// Block unauthenticated access to protected routes
	const isProtectedRoute = protectedRoutes.some((route) =>
		pathname.startsWith(route)
	);
	if (isProtectedRoute && !isAuthed) {
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
