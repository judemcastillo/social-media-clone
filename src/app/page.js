"use server";

import { auth } from "@/auth";
import { SignIn } from "@/components/buttons/SignInButton";
import { SignOutButton } from "@/components/buttons/SignOutButton";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

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
		<main className="flex min-h-screen flex-row items-center  justify-center gap-10 bg-sky-50">
			<LoginForm/>
			<RegisterForm/>
		</main>
	);
}
