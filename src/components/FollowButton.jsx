// components/FollowButton.jsx
"use client";

import { useActionState, useState, useEffect } from "react";
import { toggleFollowAction } from "@/lib/actions/follow-actions";
import { Button } from "./ui/button";

/**
 * Props:
 *  - viewerId
 *  - targetId
 *  - initialIsFollowing   (bool)
 *  - initialFollowsYou    (bool)
 *  - onChange?(following) optional: bubble to parent to patch local post list
 */
export default function FollowButton({
	viewerId,
	targetId,
	initialIsFollowing = false,
	initialFollowsYou = false,
	onChange,
	size = "sm",
	className = "",
}) {
	if (!viewerId || !targetId || viewerId === targetId) return null;

	// keep state on the client; server action returns the authoritative value
	const initial = { ok: false, following: !!initialIsFollowing, error: "" };

	const [followState, setFollowState] = useState(initialIsFollowing);

	const [state, formAction, pending] = useActionState(
		toggleFollowAction,
		initial
	);

	useEffect(() => {
		if (state.ok) {
			setFollowState(state.following);
		}
	}, [state]);

	return (
		<form
			action={formAction}
			className={`inline-flex flex-col items-end ${className}`}
		>
			<input type="hidden" name="userId" value={targetId} />
			<Button
				type="submit"
				variant={followState ? "secondary" : "default"}
				className="cursor-pointer"
				aria-pressed={followState}
				disabled={pending}
			>
				{followState ? "Following" : "Follow"}
			</Button>
			{state.error && (
				<span className="mt-1 text-[11px] text-red-500">{state.error}</span>
			)}
		</form>
	);
}
