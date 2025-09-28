import { auth } from "@/auth";
import Header from "@/components/Header";
import { UserProvider } from "@/components/providers/user-context";
import fetchOneUserAction from "@/lib/actions/discover-actions";

export default async function RootLayout({ children }) {
	const session = await auth();
	const me = session?.user?.id;
	const { user } = await fetchOneUserAction(me);

	return (
		<UserProvider value={user}>
			<div className="bg-background">
				<div className="col-span-4 border-none  shadow-lg z-50 h-[7vh] ">
					<Header />
				</div>
				{children}
			</div>
		</UserProvider>
	);
}
