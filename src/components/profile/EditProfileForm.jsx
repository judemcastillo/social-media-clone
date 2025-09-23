// src/components/EditProfileUploadForm.jsx
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateProfileWithUploadsAction } from "@/lib/actions/profile-actions";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import Link from "next/link";

export default function EditProfileUploadForm({ user }) {
	const [state, formAction, pending] = useActionState(
		updateProfileWithUploadsAction,
		{ ok: false, error: "" }
	);

	const [avatarPreview, setAvatarPreview] = useState(user?.image || "");
	const [coverPreview, setCoverPreview] = useState(user?.coverImageUrl || "");
	const [skills, setSkills] = useState(
		Array.isArray(user?.skills) ? user.skills : []
	);
	const [skillInput, setSkillInput] = useState("");

	const formRef = useRef(null);

	useEffect(() => {
		if (state.ok) {
			formRef.current?.reset?.();
		}
	}, [state.ok]);

	function addSkill(raw) {
		const s = String(raw || "").trim();
		if (!s) return;
		// de-dupe case-insensitively
		const exists = skills.some((k) => k.toLowerCase() === s.toLowerCase());
		if (exists) return;
		setSkills((arr) => [...arr, s]);
		setSkillInput("");
	}

	function removeSkill(s) {
		setSkills((arr) => arr.filter((x) => x !== s));
	}

	return (
		<Card className="p-6 max-h[93vh] overflow-y-auto  max-w-[700px] w-full mx-auto space-y-6">
			<form
				ref={formRef}
				action={formAction}
				encType="multipart/form-data"
				className="space-y-5"
			>
				{/* Cover */}
				<div>
					<label className="block text-sm font-medium">Cover photo</label>
					<div className="mt-2 relative h-40 w-full rounded-xl border overflow-hidden bg-gray-100">
						{coverPreview && (
							<Image
								src={coverPreview}
								alt="cover"
								fill
								className="object-cover"
								unoptimized
							/>
						)}
					</div>
					<Input
						type="file"
						name="cover"
						accept="image/*"
						className="mt-2 block w-fit text-sm"
						onChange={(e) => {
							const f = e.target.files?.[0];
							if (f) setCoverPreview(URL.createObjectURL(f));
						}}
					/>
				</div>

				{/* Avatar */}
				<div>
					<label className="block text-sm font-medium">Profile picture</label>
					<div className="mt-2 h-28 w-28 overflow-hidden rounded-full border bg-white">
						{avatarPreview && (
							<Image
								src={avatarPreview}
								alt="avatar"
								width={112}
								height={112}
								className="h-28 w-28 object-cover rounded-full"
								unoptimized
							/>
						)}
					</div>
					<Input
						type="file"
						name="avatar"
						accept="image/*"
						className="mt-2 block w-fit text-sm cursor-pointer"
						onChange={(e) => {
							const f = e.target.files?.[0];
							if (f) setAvatarPreview(URL.createObjectURL(f));
						}}
					/>
				</div>

				{/* Name */}
				<div>
					<label className="block text-sm font-medium">Name</label>
					<input
						name="name"
						defaultValue={user?.name ?? ""}
						className="mt-1 w-full rounded border px-3 py-2"
					/>
				</div>

				{/* Bio */}
				<div>
					<label className="block text-sm font-medium">Bio</label>
					<textarea
						name="bio"
						rows={3}
						defaultValue={user?.bio ?? ""}
						className="mt-1 w-full rounded border px-3 py-2"
					/>
				</div>

				{/* Skills: chips + input (press Enter to add) */}
				<div>
					<label className="block text-sm font-medium">Skills</label>

					{/* Hidden field submitted to server (comma-separated) */}
					<input type="hidden" name="skills" value={skills.join(",")} />

					<div className="mt-2 rounded-lg border p-2">
						{/* chips */}
						{skills.length > 0 && (
							<div className="mb-2 flex flex-wrap gap-2">
								{skills.map((s) => (
									<span
										key={s}
										className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs"
									>
										{s}
										<button
											type="button"
											aria-label={`Remove ${s}`}
											className="rounded-full px-1 text-gray-500 hover:text-black"
											onClick={() => removeSkill(s)}
										>
											×
										</button>
									</span>
								))}
							</div>
						)}
					</div>
					{/* input */}
					<div className="flex gap-2 flex-row flex-start mt-3 items-center w-fit">
						<Input
							type="text"
							value={skillInput}
							onChange={(e) => setSkillInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									addSkill(skillInput);
								} else if (
									e.key === "Backspace" &&
									!skillInput &&
									skills.length
								) {
									// quick-remove last chip with backspace
									removeSkill(skills[skills.length - 1]);
								}
							}}
							placeholder="Add Skill"
							className=" bg-transparent p-2 text-sm outline-none border-2 rounded-md border-gray-200 "
						/>
						<button
							type="button"
							className="text-sm bg-sky-400 text-white rounded-xl h-fit w-40 px-2 py-1 hover:underline cursor-pointer"
							onClick={() => addSkill(skillInput)}
						>
							+ Add Skill
						</button>
					</div>

					<p className="mt-1 text-xs text-gray-500">
						Add skills one by one. Press Enter to add. Click × to remove.
					</p>
				</div>

				{state.error && <p className="text-sm text-red-500">{state.error}</p>}
				<Button type="submit" disabled={pending}>
					{pending ? "Saving…" : "Save changes"}
				</Button>
				<Link href={`/user/${user.id}`}>
					<Button variant="outline" type="button">
						Cancel
					</Button>
				</Link>
			</form>
		</Card>
	);
}
