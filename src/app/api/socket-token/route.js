// app/api/socket-token/route.js
import { auth } from "@/auth";
import { SignJWT } from "jose";

const secret = new TextEncoder().encode(
	process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
);

export async function GET() {
	const session = await auth();
	if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

	const payload = {
		sub: session.user.id,
		role: session.user.role || "USER",
	};

	const token = await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("10m")
		.sign(secret);

	return Response.json({ token });
}
