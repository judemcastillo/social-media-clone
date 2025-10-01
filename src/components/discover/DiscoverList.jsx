// src/components/discover/DiscoverList.jsx
"use client";

import { useActionState, useEffect, useState } from "react";
import {
	loadMoreDiscoverAction,
	searchDiscoverAction,
} from "@/lib/actions/discover-actions";
import { Button } from "@/components/ui/button";
import { Loader2Icon, Search } from "lucide-react";
import ProfileCard from "../profile/ProfileCard";

export default function DiscoverList({
	initialUsers,
	initialNextCursor,
	viewerId,
	viewerRole,
}) {
	const [users, setUsers] = useState(initialUsers || []);
	const [cursor, setCursor] = useState(initialNextCursor || null);
	const [q, setQ] = useState("");

	// Load-more
	const [state, formAction, pending] = useActionState(loadMoreDiscoverAction, {
		ok: false,
	});

	// Search
	const [searchState, searchFormAction, searching] = useActionState(
		searchDiscoverAction,
		{ ok: false }
	);

	useEffect(() => {
		if (state?.ok) {
			setUsers((prev) => [...prev, ...(state.users || [])]);
			setCursor(state.nextCursor || null);
		}
	}, [state]);

	useEffect(() => {
		if (searchState?.ok) {
			setUsers(searchState.users || []);
			setCursor(searchState.nextCursor || null);
		}
	}, [searchState]);

	return (
		<>
			{/* Search bar (keeps your layout minimal) */}
			<form
				action={(fd) => {
					fd.set("q", q);
					searchFormAction(fd);
				}}
				className="mb-4 flex items-center  rounded-2xl border-muted border-1 p-1 dark:border-gray-500"
			>
				<Button
					type="submit"
					disabled={searching}
					variant="icon"
					className="cursor-pointer text-sm p-0 border-r-muted border-r-1 rounded-none px-0 dark:border-gray-500"
				>
					{searching ? (
						<>
							<Loader2Icon className=" h-4 w-4 animate-spin" />
						</>
					) : (
						<>
							<Search className=" size-4 px-0" />
						</>
					)}
				</Button>
				<input
					value={q}
					onChange={(e) => setQ(e.target.value)}
					placeholder="Search users by name, email, or bio…"
					className="w-full px-3 border-none rounded-2xl m-0 focus:outline-none focus:ring-0 focus:border-transparent text-sm"
				/>
			</form>

			<div className="grid sm:grid-cols-3 sm:gap-4 grid-cols-2 gap-1">
				{users.map((u) => {
					const canFollow =
						viewerId && viewerRole !== "GUEST" && u.role !== "GUEST";
					return (
						<div key={u.id}>
							<ProfileCard u={u} canFollow={canFollow} viewerId={viewerId} />
						</div>
					);
				})}
				{!users.length && (
					<div className="col-span-full text-center text-sm text-muted-foreground py-6">
						{searching ? "Searching…" : "No users found"}
					</div>
				)}
			</div>

			{/* Load more (preserves current query) */}
			<div className="flex justify-center py-4">
				{cursor ? (
					<form
						action={(fd) => {
							fd.set("cursor", cursor);
							fd.set("q", q);
							formAction(fd);
						}}
					>
						<Button
							type="submit"
							disabled={pending}
							variant="ghost"
							className="cursor-pointer text-muted-foreground"
						>
							{pending ? (
								<>
									<Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Loading…
								</>
							) : (
								"Load more"
							)}
						</Button>
					</form>
				) : (
					<span className="text-xs text-muted-foreground"></span>
				)}
			</div>
		</>
	);
}
