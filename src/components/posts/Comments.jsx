// src/components/posts/Comments.jsx
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addComment, deleteComment } from "@/lib/actions/posts-actions";
import Image from "next/image";
import { fetchComments } from "@/lib/helpers/fetch";
import { ScrollArea } from "../ui/scroll-area";

export default function Comments({ postId, session }) {
	const [items, setItems] = useState([]); // you can lazy-load from /api/comments?postId=...
	const [state, formAction, pending] = useActionState(addComment, {
		ok: false,
	});
	const [nextCursor, setNextCursor] = useState(null);
	const formRef = useRef(null);

	useEffect(() => {
		if (state.ok && state.comment) {
			setItems((prev) => [state.comment, ...prev]); // optimistic add
			formRef.current?.reset();
		}
	}, [state]);

	useEffect(() => {
		let ignore = false;
		(async () => {
			const { items, nextCursor } = await fetchComments({ postId, limit: 20 });
			if (!ignore) {
				setItems(items);
				setNextCursor(nextCursor);
			}
		})();
		return () => {
			ignore = true;
		};
	}, [postId]);

	async function onDelete(id) {
		// optimistically remove
		setItems((prev) => prev.filter((c) => c.id !== id));
		const fd = new FormData();
		fd.set("commentId", id);
		const res = await deleteComment(null, fd);
		if (!res?.ok) {
			// revert if failed
			// (you can refetch here instead)
		}
	}

	return (
		<div className="flex flex-col gap-2 border-t-2 pb-2 pt-3">
			{/* Comments list */}
			<ul className="space-y-3 overflow-y-auto ">
				{items.map((c) => (
					<li key={c.id} className="flex gap-2 items-start w-fit px-2">
						{c.author?.image ? (
							<Image
								src={c.author.image}
								alt="avatar"
								width={24}
								height={24}
								className="rounded-full pt-2"
							/>
						) : (
							<div className="pt-2 size-8 rounded-full bg-zinc-300" />
						)}
						<div className="flex-1 ">
							<div className="bg-gray-100 rounded-md p-2 ">
								<div className="text-sm">
									<span className="font-medium">
										{c.author?.name || c.author?.email}
									</span>{" "}
									<span className="opacity-60">
										{new Date(c.createdAt).toLocaleString()}
									</span>
								</div>

								<div className="text-sm whitespace-pre-wrap">{c.content}</div>
							</div>
							{(session?.user?.id === c.author?.id ||
								session?.user?.role === "ADMIN") && (
								<button
									onClick={() => onDelete(c.id)}
									className="ml-2 text-xs opacity-70 hover:opacity-100"
								>
									Delete
								</button>
							)}
						</div>
					</li>
				))}
			</ul>
			{/* Add comment form */}
			<form
				ref={formRef}
				action={(fd) => {
					fd.set("postId", postId);
					return formAction(fd);
				}}
				className="flex gap-2"
			>
				<input
					name="content"
					placeholder="Write a comment…"
					className="flex-1 rounded border px-3 py-2 bg-transparent "
					required
				/>
				<button className="px-3 py-2 rounded border text-sm" disabled={pending}>
					{pending ? "Posting…" : "Reply"}
				</button>
			</form>
		</div>
	);
}
