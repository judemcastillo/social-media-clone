"use client";

import { useActionState, useEffect, useState } from "react";
import { loadMoreDiscoverAction } from "@/lib/actions/discover-actions";
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";
import ProfileCard from "../profile/ProfileCard";
import { Avatar } from "../Avatar";
import { Card, CardTitle } from "../ui/card";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "../ui/hover-card";

export default function DiscoverWidget({
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
		<Card className="flex flex-col p-5 gap-3 h-fit">
			<CardTitle>Yappers you may know</CardTitle>
			<div className="grid 2xl:grid-cols-6 gap-2 grid-cols-5">
				{users.map((u) => {
					const canFollow =
						viewerId && viewerRole !== "GUEST" && u.role !== "GUEST";
					return (
						<HoverCard key={u.id}>
							<HoverCardTrigger className="m-auto cursor-pointer">
								<Avatar src={u.image} size={50} userId={u.id} />
							</HoverCardTrigger>
							<HoverCardContent className="p-0 m-0 border-none rounded-xl">
								<ProfileCard u={u} canFollow={canFollow} viewerId={viewerId} />
							</HoverCardContent>
						</HoverCard>
					);
				})}
			</div>

			{/* Load more (no navigation) */}
			<div className="flex justify-center">
				{cursor ? (
					<form
						action={(fd) => {
							fd.set("cursor", cursor);
							formAction(fd);
						}}
					>
						<Button type="submit" disabled={pending} variant="link">
							{pending ? (
								<>
									<Loader2Icon className="h-4 w-4 animate-spin" /> Loading…
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
		</Card>
	);
}
