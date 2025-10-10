"use server";

import { fetchConversations } from "@/lib/actions/conversation-actions";
import ConversationsClient from "./ConversationsClient";

import { fetchUsersAction } from "@/lib/actions/discover-actions";

export default async function RootLayout({ children }) {
	const { conversations } = await fetchConversations();
	const { users, nextCursor } = await fetchUsersAction();
	return (
		<div className="flex flex-row w-full max-w-screen">
			<div className="flex-1 max-w-[350px] w-full">
				<ConversationsClient
					initialItems={conversations}
					initialMembers={users}
					nextCursor={nextCursor}
				/>
			</div>
			<div className="flex-1">{children}</div>
		</div>
	);
}
