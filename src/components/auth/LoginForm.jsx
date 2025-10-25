"use client";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginWithCredentials } from "@/lib/actions/auth-actions";
import GuestSignInButton from "../buttons/GuestSignInButton";
import { GithubSignInButton } from "../buttons/GithubSignInButton";
import Link from "next/link";

function SubmitButton() {
	const { pending } = useFormStatus;
	return (
		<Button type="submit" className="w-full" disabled={pending}>
			{pending ? "Signing in..." : "Sign in"}
		</Button>
	);
}

export default function LoginForm() {
	const initialState = { ok: false, errors: {} };
	const [state, formAction, pending] = useActionState(
		loginWithCredentials,
		initialState
	);
	return (
		<Card className="h-screen max-w-[600px] w-full flex flex-col justify-center shadow-lg items-center rounded-none bg-card ">
			<div className=" flex-col items-center  flex lg:hidden">
				<div className="text-center text-4xl font-[sans-serif] font-extrabold">
					Welcome To
				</div>
				<img src="/title.png" alt="Yap Space" className="w-[340px]" />
			</div>
			<CardHeader className="text-center w-full ">
				<CardTitle className="font-extrabold text-2xl">
					Log in to your account
				</CardTitle>
				<div className="text-sm text-muted-foreground">
					Enter your email below to login to your account
				</div>
			</CardHeader>
			<CardContent className=" flex flex-col justify-center items-center gap-2 w-full  lg:px-20 px-10">
				<form action={formAction} className="flex flex-col gap-4  w-full">
					{state?.errors?._form?.length ? (
						<div className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{state.errors._form[0]}
						</div>
					) : null}
					<div>
						<Input type="email" placeholder="Email" name="email" required />
						{state?.errors?.email?.length ? (
							<p className="text-red-500 text-sm">{state.errors.email[0]}</p>
						) : null}
					</div>
					<div>
						<Input
							type="password"
							placeholder="Password"
							name="password"
							required
						/>
						{state?.errors?.password?.length ? (
							<p className="text-red-500 text-sm mt-1">
								{state.errors.password[0]}
							</p>
						) : null}
					</div>

					<Button type="submit" className="w-full" disabled={pending}>
						{pending ? "Signing in..." : "Sign in"}
					</Button>
				</form>
				<div className="divider w-full">Or continue with</div>
				<GuestSignInButton />
				<GithubSignInButton />
				<div className="mt-4 text-muted-foreground">
					Don't have an account?{" "}
					<Link href="/register">
						<span className="text-accent-foreground hover:underline cursor-pointer">
							Sign up
						</span>
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}
