// src/components/posts/LikeButton.jsx
"use client";

import { useActionState, useEffect, useState } from "react";
import { toggleLike } from "@/lib/actions/posts-actions";
import { ThumbsUp } from "lucide-react";
import { Button } from "../ui/button";

export default function LikeButton({ post, handleLikeCount }) {
	const [state, formAction, pending] = useActionState(toggleLike, {
		ok: false,
	});
	const [isLiked, setLiked] = useState(post.likedByMe);

	useEffect(() => {
		if (state.ok) {
			setLiked(state.liked);
			handleLikeCount(state.liked);
		}
	}, [state]);

	return (
		<form
			action={(fd) => {
				fd.set("postId", post.id);
				return formAction(fd);
			}}
		>
			<Button
				type="submit"
				variant="ghost"
				disabled={pending}
				className={`flex flex-row items-center justify-center gap-2 p-2 r cursor-pointer
          hover:underline  w-full
          ${isLiked ? "text-primary font-medium" : ""}`}
			>
				<ThumbsUp
					className={`size-4 ${isLiked ? "fill-primary text-primary" : ""}`}
				/>
				<span>{isLiked ? "Liked" : "Like"}</span>
			</Button>
		</form>
	);
}
