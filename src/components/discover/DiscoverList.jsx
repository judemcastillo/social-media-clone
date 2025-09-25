"use client";

import { useActionState, useEffect, useState } from "react";
import { loadMoreDiscoverAction } from "@/lib/actions/discover-actions";
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";
import ProfileCard from "../profile/ProfileCard";

export default function DiscoverList({
	initialUsers,
	initialNextCursor,
	viewerId,
	viewerRole,
}) {
	const [users, setUsers] = useState(initialUsers || []);
	const [cursor, setCursor] = useState(initialNextCursor || null);

	const [state, formAction, pending] = useActionState(loadMoreDiscoverAction, {
		ok: false,
	});

	useEffect(() => {
		if (state?.ok) {
			setUsers((prev) => [...prev, ...(state.users || [])]);
			setCursor(state.nextCursor || null);
		}
	}, [state]);

	return (
		<>
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
			</div>

			{/* Load more (no navigation) */}
			<div className="flex justify-center py-4">
				{cursor ? (
					<form
						action={(fd) => {
							fd.set("cursor", cursor);
							formAction(fd);
						}}
					>
						<Button type="submit" disabled={pending} variant="ghost" className="cursor-pointer text-muted-foreground">
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
					<span className="text-xs text-muted-foreground">No more users</span>
				)}
			</div>
		</>
	);
}
