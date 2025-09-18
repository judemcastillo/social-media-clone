"use client";

import { createPost } from "@/lib/actions/posts-actions";
import { useActionState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { Send } from "lucide-react";

function SubmitButton() {
	const { pending } = useFormStatus();
	return (
		<Button type="submit" className="pt-2" disabled={pending} variant="outline">
			{pending ? (
				<div className="flex flex-row items-center gap-2">
					Yapping...
					<Send />
				</div>
			) : (
				<div className="flex flex-row items-center gap-2">
					Yap
					<Send />
				</div>
			)}
		</Button>
	);
}

export default function PostForm({ session, onCreated }) {
	const initialstate = { ok: false, error: "", post: null };
	const [state, formAction, isPending] = useActionState(
		createPost,
		initialstate
	);
	const formRef = useRef(null);

	useEffect(() => {
		if (state.ok && state.post) {
			onCreated?.(state.post); // 👈 notify parent
			formRef.current?.reset();
		}
	}, [state, onCreated]);

	return (
		<Card className="w-full p-5 shadow-lg max-w-[700px] pb-3">
			<CardHeader className="p-0">
				<CardTitle className="p-0 flex flex-row justify-start items-center gap-3">
					{session?.user?.image ? (
						<Image
							src={session.user.image}
							alt="Profile Picture"
							width={30}
							height={30}
							className="rounded-full"
						/>
					) : (
						<div className="w-[30px] h-[30px] rounded-full bg-zinc-200" />
					)}
					<div className="flex flex-col text-md gap-1">
						<span>{session?.user?.name}</span>
						<span className="text-[12px] font-extralight">
							{session?.user?.email}
						</span>
					</div>
				</CardTitle>
			</CardHeader>
			<form action={formAction} ref={formRef}>
				<div className="flex flex-row items-center ">
					<textarea
						name="content"
						rows={2}
						placeholder="What do you want to yap?"
						className="w-full bg-transparent border-none rounded  text-sm  focus:outline-none focus:ring-0 focus:border-transparent "
						required
					/>
				</div>

				{state?.error && <p className="text-sm text-red-500">{state.error}</p>}
				<hr />
				<div className="flex justify-end pt-1">
					<SubmitButton />
				</div>
			</form>
		</Card>
	);
}
