// src/app/messages/page.jsx
import { fetchConversations } from "@/lib/actions/conversation-actions";
import ConversationsClient from "./ConversationsClient";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
	const { conversations } = await fetchConversations();
	return (
		<Card className="p-6 m-4 h-[87vh] flex flex-col items-center justify-center">
			<div className="w-full flex flex-col items-center justify-center h-full flex-1">
				<CardTitle>You have (no. of unread messages)unread messages</CardTitle>
			</div>
			<div className="divider flex-2">Message Yappers</div>
			<div className="divider flex-2">Chat Rooms</div>
		</Card>
	);
}
