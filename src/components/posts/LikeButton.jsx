// src/components/posts/LikeButton.jsx
"use client";

import { useActionState, useEffect, useState } from "react";
import { toggleLike } from "@/lib/actions/posts-actions";
import { ThumbsUp } from "lucide-react";

export default function LikeButton({ post, onOptimisticToggle = () => {} }) {
	const [state, formAction, pending] = useActionState(toggleLike, {
		ok: false,
	});
	const [isLiked, setLiked] = useState(post.likedByMe);

	useEffect(() => {
		if (state.ok) {
			setLiked(state.liked);
		}
	}, [state]);

	return (
		<form
			action={(fd) => {
				fd.set("postId", post.id);
				onOptimisticToggle(post.id); // optimistic update in parent
				return formAction(fd);
			}}
		>
			<button
				type="submit"
				disabled={pending}
				className={`flex flex-row items-center justify-center gap-2 p-2 rounded cursor-pointer
          hover:underline hover:bg-gray-100 w-full
          ${isLiked ? "text-sky-400 font-medium" : "text-gray-700"}`}
			>
				<ThumbsUp
					className={`size-4 ${isLiked ? "fill-sky-400 text-sky-400" : ""}`}
				/>
				<span>{isLiked ? "Liked" : "Like"}</span>
			</button>
		</form>
	);
}
