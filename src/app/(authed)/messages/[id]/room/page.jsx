import { auth } from "@/auth";
import { fetchMessagesPage } from "@/lib/actions/conversation-actions";
import ChatRoom from "../ChatRoom";

export const dynamic = "force-dynamic";

export default async function RoomConversationPage({ params }) {
	const session = await auth();
	if (session?.user?.role === "GUEST") {
		return (
			<Card className="m-6">
				<CardHeader className="text-center">
					<CardTitle>Access Denied</CardTitle>
					<CardDescription>
						You must be a registered user to access this page.
					</CardDescription>
				</CardHeader>
			</Card>
		);
	}
	if (!session?.user?.id) return null;

	const { id } = params;
	const result = await fetchMessagesPage({
		id,
		kind: "room",
		limit: 30,
	});

	if (!result?.ok) return null;

	const {
		conversationId,
		messages,
		nextCursor,
		title,
		peers,
		participants,
		viewerRole,
		viewerStatus,
	} = result;

	return (
		<ChatRoom
			conversationId={conversationId}
			kind="room"
			requestId={id}
			initialMessages={messages}
			initialCursor={nextCursor}
			title={title}
			peers={peers}
			participants={participants}
			viewerRole={viewerRole}
			viewerStatus={viewerStatus}
		/>
	);
}
