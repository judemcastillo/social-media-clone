// components/EditPost.jsx
"use client";

import { useEffect, useState, useActionState } from "react";
import { fetchOnePost } from "@/lib/helpers/fetch"; // make sure this path matches your helpers file
import { updatePostAction } from "@/lib/actions/posts-actions"; // singular: post-actions.js
import { Card } from "../ui/card";
import { Textarea } from "../ui/textarea";

const initialState = { ok: false, error: "", id: null };

export default function EditPost({ postId }) {
	const [postForm, setPostForm] = useState("");
	const [loading, setLoading] = useState(true);

	const [state, formAction, pending] = useActionState(
		updatePostAction,
		initialState
	);

	useEffect(() => {
		let alive = true;
		(async () => {
			try {
				const { post } = await fetchOnePost(postId);
				if (alive) setPostForm(post?.content ?? "");
			} finally {
				if (alive) setLoading(false);
			}
		})();
		return () => {
			alive = false;
		};
	}, [postId]);

	return (
		<Card className="p-4 space-y-3 m-6 shadow-lg">
			{postId}

			<form
				action={(formData) => {
					formData.set("postId", postId);
					return formAction(formData);
				}}
				className="space-y-3"
			>
				<Textarea
					name="content"
					value={postForm}
					onChange={(e) => setPostForm(e.target.value)}
					rows={8}
					maxLength={5000}
					disabled={pending}
					placeholder={loading ? "Loading…" : "Edit your post…"}
				/>
				<div className="flex gap-2">
					<button
						type="submit"
						disabled={pending || !postForm.trim()}
						className="rounded-md border px-3 py-2"
					>
						{pending ? "Saving…" : "Save changes"}
					</button>
					<a href={`/post/${postId}`} className="rounded-md border px-3 py-2">
						Cancel
					</a>
				</div>
			</form>

			{state.error && <p className="text-sm text-red-600">{state.error}</p>}
		</Card>
	);
}
