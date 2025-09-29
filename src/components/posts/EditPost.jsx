// components/EditPost.jsx
"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { updatePostAction } from "@/lib/actions/posts-actions";
import { Card } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { useUser } from "../providers/user-context";
import { Button } from "../ui/button";
import Link from "next/link";
import { Avatar } from "../Avatar";
import Image from "next/image";
import EmojiDropdown from "../EmojiDropdown";
import { ImagePlus } from "lucide-react";
import { fetchOnePost } from "@/lib/helpers/fetch";

const initialState = { ok: false, error: "", id: null };

export default function EditPost({ postId }) {
	const viewer = useUser();
	const [postForm, setPostForm] = useState("");
	const [previewUrl, setPreviewUrl] = useState(null); // for local preview
	const [removeImage, setRemoveImage] = useState(false); // tell server to clear image
	const [loading, setLoading] = useState(true);

	const [state, formAction, pending] = useActionState(
		updatePostAction,
		initialState
	);

	const textareaRef = useRef(null);
	const fileInputRef = useRef(null);

	// ✅ Fetch via GET helper (not a server action)
	useEffect(() => {
		let alive = true;
		(async () => {
			try {
				const { post } = await fetchOnePost(postId);
				if (!alive) return;
				setPostForm(post?.content ?? "");
				// show existing image (no preview blob yet)
				setPreviewUrl(post?.imageUrl ?? null);
				setRemoveImage(false);
			} finally {
				if (alive) setLoading(false);
			}
		})();
		return () => {
			alive = false;
		};
	}, [postId]);

	// insert emoji at caret
	function insertAtCaret(char) {
		const el = textareaRef.current;
		if (!el) return setPostForm((c) => c + char);
		const start = el.selectionStart ?? postForm.length;
		const end = el.selectionEnd ?? postForm.length;
		const next = postForm.slice(0, start) + char + postForm.slice(end);
		setPostForm(next);
		queueMicrotask(() => {
			el.focus();
			el.selectionStart = el.selectionEnd = start + char.length;
		});
	}

	// local preview only; send the actual file in form submission
	function onFileChange(e) {
		const file = e.target.files?.[0];
		if (!file) {
			setPreviewUrl(null);
			setRemoveImage(true);
			return;
		}
		if (!file.type.startsWith("image/")) {
			e.target.value = "";
			alert("Only images are allowed.");
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			e.target.value = "";
			alert("Max file size is 5MB.");
			return;
		}
		// show preview and mark that we are NOT removing the image
		const url = URL.createObjectURL(file);
		setPreviewUrl(url);
		setRemoveImage(false);
	}

	function clearImage() {
		// clear both existing and newly selected image
		setPreviewUrl(null);
		setRemoveImage(true);
		if (fileInputRef.current) fileInputRef.current.value = "";
	}

	return (
		<Card className="p-4  m-6 flex flex-col">
			<div className="flex flex-row text-sm gap-3">
				<Avatar src={viewer?.image} size={40} />
				<span className="flex flex-col">
					{viewer?.name || viewer?.email}
					<span className="text-gray-500 text-xs">Public</span>
				</span>
			</div>

			<form
				action={(formData) => {
					formData.set("postId", postId);
					formData.set("removeImage", removeImage ? "1" : "0"); // 👈 tell server to clear if needed
					// NOTE: do NOT set imageUrl here; the <input name="image"> carries the File for server upload
					return formAction(formData);
				}}
				className="space-y-3 w-full"
			>
				<Textarea
					ref={textareaRef}
					name="content"
					value={postForm}
					onChange={(e) => setPostForm(e.target.value)}
					rows={8}
					maxLength={5000}
					disabled={pending}
					placeholder={loading ? "Loading…" : "Edit your post…"}
				/>

				{/* Image preview (existing or newly selected) */}
				{previewUrl && (
					<div className="mt-2">
						<div className="relative h-64 w-full overflow-hidden rounded-xl border">
							<Image
								src={previewUrl}
								alt="preview"
								fill
								className="object-cover"
								unoptimized
								loading="lazy"
							/>
						</div>
						<div className="mt-2">
							<Button
								type="button"
								variant="outline"
								className="text-sm border-none cursor-pointer"
								onClick={clearImage}
							>
								Remove photo
							</Button>
						</div>
					</div>
				)}

				{/* Toolbar: emoji + image picker */}
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<EmojiDropdown onPick={insertAtCaret} />

						<label className="inline-flex items-center gap-2 cursor-pointer rounded-md border px-2 py-1 text-sm hover:bg-primary/5 hover:text-primary">
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								name="image" // 👈 IMPORTANT: submit the File to the server
								onChange={onFileChange}
								className="hidden"
							/>
							<span className="inline-flex items-center gap-1  border-none rounded-md">
								<ImagePlus className="w-4 h-4" />
								Add image
							</span>
						</label>
					</div>

					<div className="flex gap-2">
						<Button
							type="submit"
							disabled={pending || !postForm.trim()}
							className="rounded-md border px-3 py-2"
						>
							{pending ? "Saving…" : "Save changes"}
						</Button>
						<Link href={`/home`} className="rounded-md border px-3 py-2">
							Cancel
						</Link>
					</div>
				</div>
			</form>

			{state.error && <p className="text-sm text-destructive">{state.error}</p>}
		</Card>
	);
}
