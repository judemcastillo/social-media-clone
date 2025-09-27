import { auth } from "@/auth";
import Header from "@/components/Header";
import LeftSideBar from "@/components/sidebar/Left";
import RightSideBar from "@/components/sidebar/Right";
import { fetchOneUser, fetchOneUserServer } from "@/lib/helpers/fetch";
import { UserProvider } from "@/components/providers/user-context";

export default async function RootLayout({ children }) {
	const session = await auth();
	const me = session?.user?.id;
	const { user } = await fetchOneUserServer(me);

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
