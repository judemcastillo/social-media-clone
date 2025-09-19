// src/components/posts/PostMenu.jsx
"use client";

import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { EllipsisVerticalIcon } from "lucide-react";
import DeletePostButton from "./DeletePostButton";
import { useState } from "react";
import Link from "next/link";

export default function PostMenu({ postId, onDeleted }) {
	const [open, setOpen] = useState(false);

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger className="size-5 text-gray-600 focus:outline-none">
				<EllipsisVerticalIcon className="size-5" />
			</DropdownMenuTrigger>
			<DropdownMenuContent className="mr-3">
				<Link href={`/post/${postId}/edit`} className="cursor-pointer">
					<DropdownMenuItem
						onSelect={(e) => e.preventDefault()}
						className="cursor-pointer"
					>
						Edit
					</DropdownMenuItem>
				</Link>

				<DeletePostButton
					postId={postId}
					onDeleted={onDeleted}
					closeMenu={() => setOpen(false)}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
