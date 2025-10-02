// src/app/messages/page.jsx
import { fetchConversations } from "@/lib/actions/conversation-actions";
import ConversationsClient from "./ConversationsClient";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
	const { conversations } = await fetchConversations();
	return <ConversationsClient initialItems={conversations || []} />;
}
