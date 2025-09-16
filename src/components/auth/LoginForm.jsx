"use client";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginWithCredentials } from "@/lib/actions/auth-actions";

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
		<div>
			<Card>
				<CardHeader>
					<CardTitle>Log in</CardTitle>
				</CardHeader>
				<CardContent>
					<form action={formAction} className="space-y-4">
						{state?.errors?._form?.length ? (
							<div className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
								{state.errors._form[0]}
							</div>
						) : null}
						<div>
							<Input type="email" placeholder="Email" name="email" required />
							{state?.errors?.email?.length ? (
								<p className="text-red-500 text-sm mt-1">
									{state.errors.email[0]}
								</p>
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
						<SubmitButton />
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
