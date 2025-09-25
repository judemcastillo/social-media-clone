// components/CreatePost.jsx
"use client";

import { createPost } from "@/lib/actions/posts-actions";
import { useActionState, useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { Send, Image as ImageIcon } from "lucide-react";
import { Avatar } from "../Avatar";
import EmojiDropdown from "../EmojiDropdown"; // <-- new

function SubmitButton() {
	const { pending } = useFormStatus();
	return (
		<Button
			type="submit"
			className="pt-2 border-none shadow-md cursor-pointer"
			disabled={pending}
			variant="outline"
		>
			<div className="flex items-center gap-2">
				{pending ? "Yapping..." : "Yap"} <Send />
			</div>
		</Button>
	);
}

export default function PostForm({ session, onCreated, user }) {
	const initialState = { ok: false, error: "", post: null };
	const [state, formAction] = useActionState(createPost, initialState);

	const formRef = useRef(null);
	const fileInputRef = useRef(null);
	const textareaRef = useRef(null);

	const [content, setContent] = useState("");
	const [preview, setPreview] = useState(null);

	useEffect(() => {
		if (state.ok && state.post) {
			onCreated?.(state.post);
			formRef.current?.reset();
			setContent("");
			setPreview(null);
		}
	}, [state, onCreated]);

	function insertAtCaret(char) {
		const el = textareaRef.current;
		if (!el) return setContent((c) => c + char);
		const start = el.selectionStart ?? content.length;
		const end = el.selectionEnd ?? content.length;
		const next = content.slice(0, start) + char + content.slice(end);
		setContent(next);
		queueMicrotask(() => {
			el.focus();
			el.selectionStart = el.selectionEnd = start + char.length;
		});
	}

	function onFileChange(e) {
		const file = e.target.files?.[0];
		if (!file) return setPreview(null);
		if (!file.type.startsWith("image/"))
			return (e.target.value = ""), alert("Only images.");
		if (file.size > 5 * 1024 * 1024)
			return (e.target.value = ""), alert("Max 5MB.");
		setPreview(URL.createObjectURL(file));
	}

	function clearImage() {
		setPreview(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	}

	return (
		<Card className="w-full p-5 shadow-lg max-w-[700px] pb-3">
			<CardHeader className="p-0">
				<CardTitle className="p-0 flex items-center gap-3">
					<Avatar src={user?.image} alt="Profile Picture" size={45} />
					<div className="flex flex-col text-md gap-1">
						<span>{user?.name}</span>
						<span className="text-[12px] font-extralight">Public</span>
					</div>
				</CardTitle>
			</CardHeader>

			<form ref={formRef} action={formAction} className="space-y-2">
				<div className="flex items-start">
					<textarea
						ref={textareaRef}
						name="content"
						rows={2}
						placeholder="What do you want to yap?"
						className="w-full bg-transparent border-none rounded text-sm focus:outline-none focus:ring-0 focus:border-transparent"
						required={!preview}
						value={content}
						onChange={(e) => setContent(e.target.value)}
					/>
				</div>

				{/* toolbar */}
				<div className="flex items-center gap-2 border-t-1 pt-3 dark:border-gray-500">
					<label className="inline-flex items-center gap-2 cursor-pointer rounded-md border px-2 py-1 text-sm hover:bg-primary/5 hover:text-primary">
						<ImageIcon className="size-4" />
						<span>Photo</span>
						<input
							ref={fileInputRef}
							type="file"
							name="image"
							accept="image/*"
							className="hidden"
							onChange={onFileChange}
						/>
					</label>
					<EmojiDropdown onPick={insertAtCaret} /> {/* ← popover picker */}
					<div className="ml-auto">
						<SubmitButton />
					</div>
				</div>

				{/* preview */}
				{preview && (
					<div className="mt-2">
						<div className="relative h-64 w-full overflow-hidden rounded-xl border">
							<Image
								src={preview}
								alt="preview"
								fill
								className="object-cover"
								unoptimized
							/>
						</div>
						<div className="mt-2">
							<Button
								type="button"
								variant="outline"
								className="text-sm"
								onClick={clearImage}
							>
								Remove photo
							</Button>
						</div>
					</div>
				)}

				{state?.error && <p className="text-sm text-red-500">{state.error}</p>}
			</form>
		</Card>
	);
}
