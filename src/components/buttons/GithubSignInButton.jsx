"use client";
import { signIn } from "next-auth/react";
import { Button } from "../ui/button";

export function GithubSignInButton() {
	return <Button className="bg-gray-500 hover:bg-gray-900 text-white w-full" onClick={() => signIn("github")}>Sign in with GitHub</Button>;
}
