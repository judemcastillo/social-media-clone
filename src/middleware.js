import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { NextRequest } from "next/server";

const protectedRoutes = ["/home"];

export default async function middleware(request) {
	const session = await auth();
	const { pathname } = request.nextUrl;

	if (pathname === "/" && session?.user) {
		return NextResponse.redirect(new URL("/home", request.url));
	}

	const isProtectedRoute = protectedRoutes.some((route) =>
		pathname.startsWith(route)
	);
	if (isProtectedRoute && !session?.user) {
		return NextResponse.redirect(new URL("/api/auth/signin", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/home/:path*"],
};
