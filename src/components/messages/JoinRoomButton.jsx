"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { joinPublicRoom } from "@/lib/actions/conversation-actions";

export default function JoinRoomButton({ conversationId, className = "" }) {
	const router = useRouter();
	const [error, setError] = useState("");
	const [joining, startJoining] = useTransition();

	const handleJoin = () => {
		if (!conversationId || joining) return;
		setError("");
		startJoining(async () => {
			try {
				const res = await joinPublicRoom(conversationId);
				if (!res?.ok) {
					setError(res?.error || "Unable to join right now.");
					return;
				}
				router.refresh();
			} catch (err) {
				console.error("Join room failed", err);
				setError("Unable to join right now.");
			}
		});
	};

	return (
		<div className="flex flex-col items-stretch gap-1">
			<Button
				type="button"
				onClick={handleJoin}
				disabled={joining}
				variant="default"
				className={`text-xs cursor-pointer ${className}`}
			>
				{joining ? "Joining…" : "Join"}
			</Button>
			{error && <span className="text-[11px] text-red-500 text-center">{error}</span>}
		</div>
	);
}
