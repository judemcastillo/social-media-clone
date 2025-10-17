"use server";

import { auth } from "@/auth";
import { SignOutButton } from "@/components/buttons/SignOutButton";
import LoginForm from "@/components/auth/LoginForm";

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
		<main className="flex min-h-screen flex-row items-center  justify-center bg-accent-foreground max-w-screen w-full">
			<div className="w-full m-auto flex-2 hidden lg:flex items-center justify-center h-full ">
				<img src="/Banner.png" alt="Logo" className="h-screen object-contain" />
			</div>
			<LoginForm />
		</main>
	);
}
