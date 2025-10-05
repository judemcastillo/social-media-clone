"use server";

import { fetchConversations } from "@/lib/actions/conversation-actions";
import ConversationsClient from "./ConversationsClient";
import SocketProvider from "@/components/chat/SocketProvider";

export default async function RootLayout({ children }) {
	const { conversations } = await fetchConversations();
	return (
		<SocketProvider>
			<div className="grid grid-cols-5 w-full max-w-screen">
				<div className="col-start-1 col-span-1">
					<ConversationsClient initialItems={conversations} />
				</div>
				<div className="col-start-2 col-span-4">{children}</div>
			</div>
		</SocketProvider>
	);
}
