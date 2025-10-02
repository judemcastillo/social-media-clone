// src/app/messages/[id]/page.jsx
import { fetchMessagesPage } from "@/lib/actions/conversation-actions";
import ChatRoom from "./ChatRoom";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }) {
	const { id } = await params; // this is the TARGET USER ID
	const { conversationId, messages, nextCursor } = await fetchMessagesPage({
		targetUserId: id,
	});
	return (
		<ChatRoom
			conversationId={conversationId}
			initialMessages={messages}
			initialCursor={nextCursor}
		/>
	);
}
