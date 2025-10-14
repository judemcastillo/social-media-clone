"use client";
import { signIn } from "next-auth/react";
import { Button } from "../ui/button";
import { FaGithub } from "react-icons/fa";

export function GithubSignInButton() {
	return (
		<Button
			className="w-full flex flex-row items-center justify-center gap-2 cursor-pointer"
			variant="secondary"
			onClick={() => signIn("github")}
		>
			Sign in with GitHub
			<FaGithub />
		</Button>
	);
}
