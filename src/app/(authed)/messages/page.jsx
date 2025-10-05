// src/app/messages/page.jsx
import { fetchConversations } from "@/lib/actions/conversation-actions";
import ConversationsClient from "./ConversationsClient";
import { Card, CardHeader } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
	const { conversations } = await fetchConversations();
	return <Card className="p-6 m-4 h-[87vh]">
		<CardHeader>You have unread messages</CardHeader>
	</Card>
}
