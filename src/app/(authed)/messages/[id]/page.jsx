import { fetchMessagesPage } from "@/lib/actions/conversation-actions";
import ChatRoom from "./ChatRoom"; // your client component
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }) {
	const session = await auth();
	if (!session?.user?.id) return null;

	const { id } = await params; // other user's id for DM
	const { ok, conversationId, messages, nextCursor, title, peers } =
		await fetchMessagesPage({ id, kind: "dm", limit: 30 });

	if (!ok) return null;

	return (
		<ChatRoom
			conversationId={conversationId}
			initialMessages={messages}
			initialCursor={nextCursor}
			title={title}
			peers={peers}
		/>
	);
}
