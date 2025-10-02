// src/app/api/socket/token/route.js
import { auth } from "@/auth";
import { SignJWT } from "jose";

export async function POST() {
	const session = await auth();
	const user = session?.user;
	if (!user?.id)
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	if (user.role === "GUEST") {
		return Response.json({ error: "Guests cannot use chat" }, { status: 403 });
	}

	const secret = new TextEncoder().encode(
		process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
	);

	const token = await new SignJWT({ role: user.role })
		.setProtectedHeader({ alg: "HS256" })
		.setSubject(user.id)
		.setIssuedAt()
		.setExpirationTime("1h")
		.sign(secret);

	return Response.json({ token });
}
