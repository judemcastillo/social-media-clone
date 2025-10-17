import { auth } from "@/auth";
import Header from "@/components/Header";
import SocketProvider from "@/components/chat/SocketProvider";
import { UserProvider } from "@/components/providers/user-context";
import { UnreadProvider } from "@/components/providers/unread-context";
import fetchOneUserAction from "@/lib/actions/discover-actions";
import { getUnreadTotal } from "@/lib/actions/conversation-actions";

export default async function RootLayout({ children }) {
	const session = await auth();
	const me = session?.user?.id;
	const { user } = await fetchOneUserAction(me);
	const initialUnread = session?.user ? await getUnreadTotal() : 0;

	return (
		<UserProvider value={user}>
			<SocketProvider>
				<UnreadProvider initialUnread={initialUnread}>
					<div className="bg-background">
						<div className="col-span-4 border-none  shadow-lg z-50 h-[7vh] ">
							<Header />
						</div>
						{children}
					</div>
				</UnreadProvider>
			</SocketProvider>
		</UserProvider>
	);
}
