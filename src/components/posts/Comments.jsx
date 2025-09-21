// src/components/posts/Comments.jsx
"use client";

import {
	useActionState,
	useEffect,
	useRef,
	useState,
	useTransition,
} from "react";
import { addComment, deleteComment } from "@/lib/actions/posts-actions";
import Image from "next/image";
import { fetchComments } from "@/lib/helpers/fetch";
import { Avatar } from "../Avatar";

export default function Comments({ postId, session }) {
	const [items, setItems] = useState([]); // you can lazy-load from /api/comments?postId=...
	const [state, formAction, pending] = useActionState(addComment, {
		ok: false,
	});
	const [nextCursor, setNextCursor] = useState(null);
	const formRef = useRef(null);
	const [loadingMore, startTransition] = useTransition();

	useEffect(() => {
		if (state.ok && state.comment) {
			setItems((prev) => [state.comment, ...prev]); // optimistic add
			formRef.current?.reset();
		}
	}, [state]);

	useEffect(() => {
		let ignore = false;
		(async () => {
			const { items, nextCursor } = await fetchComments({ postId, limit: 10 });
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
	async function loadMore() {
		if (!nextCursor) return;
		startTransition(async () => {
			const { items: more, nextCursor: nc } = await fetchComments({
				postId,
				limit: 10,
				cursor: nextCursor,
			});
			setItems((prev) => {
				const seen = new Set(prev.map((c) => c.id));
				const uniques = more.filter((c) => !seen.has(c.id));
				// We’re loading OLDER items, so append at the END:
				return [...prev, ...uniques];
			});
			setNextCursor(nc);
		});
	}
	return (
		<div className="flex flex-col gap-2 border-t-2 pb-2 pt-3">
			<ul className="space-y-3 overflow-y-auto max-h-[200px] ">
				{items.map((c) => (
					<li key={c.id} className="flex gap-2 items-start w-fit px-2">
						<Avatar src={c.author?.image} alt="avatar" size={30} className="mt-1"/>
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
				{/* Comments list */}
				{nextCursor && (
					<button
						onClick={loadMore}
						disabled={loadingMore}
						className="self-start text-xs px-2 py-2  hover:bg-gray-50 hover:underline"
					>
						{loadingMore ? "Loading…" : "View more comments"}
					</button>
				)}
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
