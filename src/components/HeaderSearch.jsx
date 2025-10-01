"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function HeaderSearch({ className = "" }) {
	const [q, setQ] = useState("");
	const router = useRouter();

	function onSubmit(e) {
		e.preventDefault();
		const term = q.trim();
		if (!term) return;
		router.push(`/search?q=${encodeURIComponent(term)}&tab=yaps`);
	}

	return (
		<form
			onSubmit={onSubmit}
			className={`flex items-center  rounded-2xl border-muted border-1 p-1 dark:border-gray-500 ${className} h-8 bg-accent`}
		>
			{" "}
			<Button
				type="submit"
				size="sm"
				variant="icon"
				className="cursor-pointer text-sm p-0 border-r-muted border-r-1 rounded-none px-0 dark:border-gray-500 h-7"
			>
				<Search className="size-3.5" />
			</Button>
			<input
				value={q}
				onChange={(e) => setQ(e.target.value)}
				placeholder="Search"
				className="w-full px-3 border-none rounded-2xl m-0 focus:outline-none focus:ring-0 focus:border-transparent text-sm"
				aria-label="Search"
			/>
		</form>
	);
}
