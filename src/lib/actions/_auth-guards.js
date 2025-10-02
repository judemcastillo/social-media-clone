// src/lib/actions/_auth-guards.js
import { auth } from "@/auth";
export async function requireNonGuest() {
	const session = await auth();
	const id = session?.user?.id;
	const role = session?.user?.role || "USER";
	if (!id) throw new Error("Unauthorized");
	if (role === "GUEST") throw new Error("Guests cannot use chat");
	return { userId: id, role };
}
