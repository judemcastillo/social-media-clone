
import { auth } from "@/auth";
import DiscoverList from "@/components/discover/DiscoverList";
import { fetchUsersAction } from "@/lib/actions/discover-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";



export default async function DiscoverPage() {
	const session = await auth();
	const viewerId = session?.user?.id ?? null;
	const viewerRole = session?.user?.role ?? "USER";

	const { ok, users, nextCursor } = await fetchUsersAction();
	const initialUsers = users;

	if (!ok)
		return (
			<div className="mx-auto max-w-[700px] py-4 max-h-[93vh] overflow-y-auto scrollbar-none w-full">
				<Card>
					<CardHeader>
						<CardTitle>Something went wrong</CardTitle>
					</CardHeader>
					<CardContent className="text-sm hover:underline text-muted-foreground ">
						<Link href="/home" className="flex flex-row items-center gap-2">
							<ArrowLeft className="size-5"/> <span>go back to home</span>
						</Link>
					</CardContent>
				</Card>
			</div>
		);

	return (
		<main className=" max-w-[700px] py-4 max-h-[93vh] overflow-y-auto scrollbar-none w-full ">
			<h1 className="text-xl font-semibold mb-4">Discover Yappers</h1>

			<DiscoverList
				initialUsers={initialUsers}
				initialNextCursor={nextCursor}
				viewerId={viewerId}
				viewerRole={viewerRole}
			/>
		</main>
	);
}
