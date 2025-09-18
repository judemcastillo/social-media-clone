// src/components/posts/DeletePostButton.jsx
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { deletePostAction } from "@/lib/actions/posts-actions";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function DeletePostButton({ postId, onDeleted, closeMenu }) {
	const initial = { ok: false, error: "" };
	const [state, formAction, pending] = useActionState(
		deletePostAction,
		initial
	);
	const formRef = useRef(null);
	const [open, setOpen] = useState(false);

	// After successful delete: close dialog + dropdown, notify parent
	useEffect(() => {
		if (state.ok) {
			onDeleted?.(postId);
			setOpen(false);
			closeMenu?.();
		}
	}, [state.ok, closeMenu, onDeleted, postId]);

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			{/* Use the dropdown item to open the dialog */}
			<AlertDialogTrigger asChild>
				<DropdownMenuItem
					onSelect={(e) => e.preventDefault()} // prevent menu from closing before we open dialog
				>
					Delete
				</DropdownMenuItem>
			</AlertDialogTrigger>

			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete this post?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>

				{/* Server action form */}
				<form ref={formRef} action={formAction}>
					<input type="hidden" name="postId" value={postId} />
					<AlertDialogFooter>
						<AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
						{/* Confirm submits the server action */}
						<AlertDialogAction
							asChild
							onClick={(e) => {
								e.preventDefault();
								formRef.current?.requestSubmit();
							}}
							disabled={pending}
						>
							<button type="submit">{pending ? "Deleting…" : "Confirm"}</button>
						</AlertDialogAction>
					</AlertDialogFooter>
				</form>

				{state.error && (
					<p className="mt-2 text-sm text-red-500">{state.error}</p>
				)}
			</AlertDialogContent>
		</AlertDialog>
	);
}
