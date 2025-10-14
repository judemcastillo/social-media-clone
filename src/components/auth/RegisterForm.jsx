"use client";
import { register } from "@/lib/actions/auth-actions";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import clsx from "clsx";
import Link from "next/link";

const initialState = { ok: false, errors: {} };

function SubmitButton() {
	const { pending } = useFormStatus;
	return (
		<Button type="submit" className="w-full" disabled={pending}>
			{pending ? "Creating Account..." : "Submit"}
		</Button>
	);
}

export default function RegisterForm() {
	const [state, formAction, isPending] = useActionState(register, initialState);

	return (
		<Card className="h-screen max-w-[600px] w-full flex flex-col justify-center shadow-lg items-center rounded-none bg-card">
			<div className="text-center p-0 flex flex-col items-center  gap-3">
				<div className="font-extrabold text-2xl text-center">Register</div>
				<div className="text-sm text-muted-foreground">
					Enter your email and password to create an account
				</div>
			</div>
			<CardContent className="flex flex-col justify-center items-center gap-2 w-full  lg:px-20 px-10">
				{state?.errors?._form?.length ? (
					<div className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
						{state.errors._form[0]}
					</div>
				) : null}
				<form action={formAction} className="space-y-4 w-full">
					<div>
						<Input
							name="name"
							placeholder="Name"
							required
							aria-invalid={Boolean(state?.errors?.name)}
							aria-describedby="name-error"
							className={clsx(
								state?.errors?.name &&
									"border-destructive focus-visible:ring-destructive"
							)}
						/>
						{state?.errors?.name?.length ? (
							<p id="name-error" className="mt-1 text-xs text-destructive">
								{state.errors.name[0]}
							</p>
						) : null}
					</div>

					<div>
						<Input
							name="email"
							type="email"
							placeholder="Email"
							required
							aria-invalid={Boolean(state?.errors?.email)}
							aria-describedby="email-error"
							className={clsx(
								state?.errors?.email &&
									"border-destructive focus-visible:ring-destructive"
							)}
						/>
						{state?.errors?.email?.length ? (
							<p id="email-error" className="mt-1 text-xs text-destructive">
								{state.errors.email[0]}
							</p>
						) : null}
					</div>

					<div>
						<Input
							name="password"
							type="password"
							placeholder="Password (min 6)"
							required
							aria-invalid={Boolean(state?.errors?.password)}
							aria-describedby="password-error"
							className={clsx(
								state?.errors?.password &&
									"border-destructive focus-visible:ring-destructive"
							)}
						/>
						{state?.errors?.password?.length ? (
							<p id="password-error" className="mt-1 text-xs text-destructive">
								{state.errors.password[0]}
							</p>
						) : null}
					</div>

					<SubmitButton />
				</form>
			</CardContent>
			<div className="mt-1 text-muted-foreground">
				Already have an account?{" "}
				<Link href="/">
					<span className="text-accent-foreground hover:underline cursor-pointer">
						Log in
					</span>
				</Link>
			</div>
		</Card>
	);
}
