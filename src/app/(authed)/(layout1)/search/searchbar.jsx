"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function SearchPageBar({ initialQ = "", activeTab = "yaps" }) {
	const [q, setQ] = useState(initialQ);
	const router = useRouter();
	const sp = useSearchParams();

	useEffect(() => {
		// keep in sync if user navigates by tab links
		const qp = sp.get("q") ?? "";
		setQ(qp);
	}, [sp]);

	function onSubmit(e) {
		e.preventDefault();
		const term = q.trim();
		if (!term) return;
		router.replace(`/search?q=${encodeURIComponent(term)}&tab=${activeTab}`);
	}

	return (
		<form
			onSubmit={onSubmit}
			className="mb-4 flex items-center  rounded-2xl border-muted border-1 p-1 dark:border-gray-500 bg-accent"
		>
			<Button
				type="submit"
				className="cursor-pointer text-sm p-0 border-r-muted border-r-1 rounded-none px-0 dark:border-gray-500 "
				variant="icon"
			>
				<Search className="size-4" />
			</Button>
			<input
				value={q}
				onChange={(e) => setQ(e.target.value)}
				placeholder="Search yaps or users…"
				className="w-full px-3 border-none rounded-2xl m-0 focus:outline-none focus:ring-0 focus:border-transparent text-sm"
				aria-label="Search"
			/>
		</form>
	);
}
