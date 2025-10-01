// src/app/.../search/page.jsx
import { auth } from "@/auth";
import { Card } from "@/components/ui/card";
import PostsFeed from "@/components/posts/PostsFeed";
import ProfileCard from "@/components/profile/ProfileCard";
import SearchPageBar from "./searchbar";
import Link from "next/link";
import {
	fetchSearchYaps,
	fetchSearchUsers,
} from "@/lib/actions/search-actions";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams: sp }) {
	const params = await sp;
	const q = (params?.q ?? "").trim();
	const tab = params?.tab === "users" ? "users" : "yaps";

	const session = await auth();
	const viewerId = session?.user?.id ?? null;
	const viewerRole = session?.user?.role ?? "USER";

	if (!q) {
		return (
			<main className="mx-auto max-w-[700px] py-4 max-h-[93vh] overflow-y-auto scrollbar-none w-full">
				<SearchPageBar initialQ="" activeTab={tab} />
				<Card className="p-6 mt-3 text-sm text-muted-foreground">
					Type something to search Yaps or Users.
				</Card>
			</main>
		);
	}

	// Fetch only the active tab
	const yapsData =
		tab === "yaps" ? await fetchSearchYaps({ q, limit: 20 }) : { posts: [] };
	const usersData =
		tab === "users" ? await fetchSearchUsers({ q, limit: 24 }) : { users: [] };

	const posts = yapsData.posts || [];
	const users = usersData.users || [];

	return (
		<main className=" max-w-[700px] py-4 max-h-[93vh] overflow-y-auto scrollbar-none w-full">
			<SearchPageBar initialQ={q} activeTab={tab} />

			<Card className="mt-3 px-4 pt-1  pb-0 shadow-lg border-b">
				<div className="flex gap-4">
					<Link
						href={`/search?q=${encodeURIComponent(q)}&tab=yaps`}
						className={`border-b-2 px-5 py-2 text-sm ${
							tab === "yaps"
								? "border-primary font-medium text-primary"
								: "border-transparent text-gray-500 hover:text-foreground-muted hover:border-gray-300"
						}`}
					>
						Yaps
					</Link>
					<Link
						href={`/search?q=${encodeURIComponent(q)}&tab=users`}
						className={`border-b-2 px-5 py-2 text-sm ${
							tab === "users"
								? "border-primary font-medium text-primary"
								: "border-transparent text-gray-500 hover:text-foreground-muted hover:border-gray-300"
						}`}
					>
						Users
					</Link>
				</div>
			</Card>

			{tab === "yaps" ? (
				<div className="pt-5">
					<PostsFeed posts={posts} nextCursor={null} />
				</div>
			) : (
				<div className="w-full max-w-[700px] space-y-3 flex flex-col items-center mt-3">
					<div className="grid sm:grid-cols-3 sm:gap-4 grid-cols-2 gap-1 w-full">
						{users.map((u) => {
							const canFollow =
								viewerId && viewerRole !== "GUEST" && u.role !== "GUEST";
							return (
								<div key={u.id}>
									<ProfileCard
										u={u}
										canFollow={canFollow}
										viewerId={viewerId}
									/>
								</div>
							);
						})}
						{!users.length && (
							<Card className="col-span-full p-6 text-center text-sm text-muted-foreground">
								No users found
							</Card>
						)}
					</div>
				</div>
			)}
		</main>
	);
}
