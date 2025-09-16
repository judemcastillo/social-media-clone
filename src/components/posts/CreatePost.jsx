"use client";

import { createPost } from "@/lib/actions/posts-actions";
import { useActionState } from "react";
import { Card, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useFormStatus } from "react-dom";
import Image from "next/image";

function SubmitButton() {
	const { pending } = useFormStatus();
	return (
		<Button type="submit" className="w-20 pt-2" disabled={pending}>
			{pending ? "Yapping..." : "Yap"}
		</Button>
	);
}

export default function PostForm({ session }) {
	const initialstate = { ok: false, error: "" };
	const [state, formAction, isPending] = useActionState(
		createPost,
		initialstate
	);

	return (
		<Card className="w-full p-4 shadow-lg space-y-3 max-w-[700px]">
			<CardHeader className="p-0">
				<CardTitle className="p-0">Yap Something</CardTitle>
			</CardHeader>
			<form action={formAction}>
				<div className="flex flex-row items-center gap-2 pb-4">
					{session?.user?.image ? (
						<Image
							src={session.user.image}
							alt="Profile Picture"
							width={30}
							height={30}
							className="rounded-full"
						/>
					) : (
						<div className="w-[30px] h-[30px] rounded-full bg-zinc-800" />
					)}
					<textarea
						name="content"
						rows={1}
						placeholder="What do you want to yap?"
						className="w-full bg-gray-100 border-none rounded-xl p-2 text-sm focus:border-none active:border-none"
						required
					/>
				</div>
				{state?.error && <p className="text-sm text-red-500">{state.error}</p>}
				<hr />
				<div className="flex justify-end pt-4">
					<SubmitButton />
				</div>
			</form>
		</Card>
	);
}
