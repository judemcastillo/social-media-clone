"use server";

import { auth } from "@/auth";
import { SignIn } from "@/components/buttons/SignInButton";
import { SignOutButton } from "@/components/buttons/SignOutButton";

export default async function Login() {
	const session = await auth();
	if (session?.user) {
		return (
			<div>
				<p>Already signed in</p>
				<SignOutButton />
			</div>
		);
	}
	return (
		<main className="flex min-h-screen flex-col items-center justify-start p-24">
			<p className="text-2xl">You are not signed in</p>
			<SignIn />
		</main>
	);
}
