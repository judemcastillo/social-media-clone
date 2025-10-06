"use server";

import { fetchConversations } from "@/lib/actions/conversation-actions";
import ConversationsClient from "./ConversationsClient";
import SocketProvider from "@/components/chat/SocketProvider";

export default async function RootLayout({ children }) {
	const { conversations } = await fetchConversations();
	return (
		<SocketProvider>
			<div className="flex flex-row w-full max-w-screen">
				<div className="flex-1 max-w-[350px] w-full">
					<ConversationsClient initialItems={conversations} />
				</div>
				<div className="flex-1">{children}</div>
			</div>
		</SocketProvider>
	);
}
