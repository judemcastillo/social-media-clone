"use client";

import { useEffect, useRef, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Smile } from "lucide-react";

/** Wraps <emoji-picker> web component (no React peer deps). */
function EmojiPickerElement({ onSelect }) {
	const ref = useRef(null);

	useEffect(() => {
		let off;
		(async () => {
			await import("emoji-picker-element"); // registers <emoji-picker>
			const el = ref.current;
			if (!el) return;
			const handler = (e) => {
				const ch =
					e.detail?.unicode ||
					e.detail?.emoji?.unicode ||
					e.detail?.emoji ||
					"";
				if (ch) onSelect?.(ch);
			};
			el.addEventListener("emoji-click", handler);
			off = () => el.removeEventListener("emoji-click", handler);
		})();
		return () => off && off();
	}, [onSelect]);

	// style width/height here; the component is self-contained
	return (
		<emoji-picker
			ref={ref}
			theme="dark"
			preview-position="none"
			emoji-size="20"
			style={{ width: "100%", height: 320, background: "transparent" }}
		/>
	);
}

/** Emoji picker shown as a popover/dropdown. */
export default function EmojiDropdown({
	onPick,
	side = "top",
	align = "start",
	buttonClass = "inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm cursor-pointer hover:bg-primary/5 hover:text-primary",
}) {
	const [open, setOpen] = useState(false);

	return (
		<DropdownMenu.Root open={open} onOpenChange={setOpen}>
			<DropdownMenu.Trigger asChild>
				<button
					type="button"
					className={buttonClass}
					aria-label="Insert emoji"
					aria-haspopup="dialog"
					variant="ghost"
				>
					<Smile className="size-4" />
					Emoji
				</button>
			</DropdownMenu.Trigger>

			<DropdownMenu.Content
				side={side}
				align={align}
				sideOffset={8}
				className="z-50 w-90 rounded-xl border-none bg-white shadow-lg"
			>
				<EmojiPickerElement
					onSelect={(char) => {
						onPick?.(char);
						setOpen(false); // close after selecting
					}}
				/>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	);
}
