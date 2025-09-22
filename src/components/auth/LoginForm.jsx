"use client";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginWithCredentials } from "@/lib/actions/auth-actions";
import GuestSignInButton from "../buttons/GuestSignInButton";
import { GithubSignInButton } from "../buttons/GithubSignInButton";

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
	const [state, formAction, isPending] = useActionState(
		loginWithCredentials,
		initialState
	);
	return (
		<Card className="h-100 w-70 flex flex-col justify-start shadow-lg items-center">
			<CardHeader className="text-left w-full">
				<CardTitle>Log in</CardTitle>
			</CardHeader>
			<CardContent className="h-full flex flex-col justify-center items-center gap-2 w-65 flex-3">
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

					<SubmitButton className="pt-6" />
				</form>
				<span>or</span>
				<GuestSignInButton />
				<GithubSignInButton />
			</CardContent>
		</Card>
	);
}
