"use client";

import { useUnread } from "@/components/providers/unread-context";

export default function UnreadSummary() {
	const { unreadTotal } = useUnread();
	const noun = unreadTotal === 1 ? "message" : "messages";

	return (
		<span>
			You have {unreadTotal} unread {noun}
		</span>
	);
}
