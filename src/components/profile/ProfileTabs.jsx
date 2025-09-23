"use client";

import { useState } from "react";
import PostsFeed from "@/components/posts/PostsFeed";
import Image from "next/image";
import Link from "next/link";
import FollowButton from "@/components/FollowButton";
import { Avatar } from "../Avatar";
import { Card } from "../ui/card";

function UsersList({ items = [], session }) {
	if (!items.length)
		return <div className="text-sm text-gray-500">No users yet.</div>;

	return (
		<ul className="space-y-2">
			{items.map((u) => {
				const handle = u.email?.split("@")[0] ?? "user";
				const canFollow =
					session?.user?.id &&
					session?.user?.role !== "GUEST" &&
					u.role !== "GUEST" &&
					u.id !== session?.user?.id;

				return (
					<Card
						key={u.id}
						className="flex items-center justify-between shadow-lg border bg-white p-3 flex-row"
					>
						<div className="flex items-center gap-3">
							<Avatar src={u.image} size={35} />
							<div>
								<Link
									href={`/user/${u.id}`}
									className="font-medium hover:underline"
								>
									{u.name || "username"}
								</Link>
							</div>
						</div>
						{canFollow && (
							<FollowButton
								viewerId={session?.user?.id}
								targetId={u.id}
								initialIsFollowing={!!u.isFollowedByMe}
								initialFollowsYou={!!u.followsMe}
								size="sm"
							/>
						)}
					</Card>
				);
			})}
		</ul>
	);
}

export default function ProfileTabs({
	session,
	initialPosts,
	followers,
	following,
}) {
	const [tab, setTab] = useState("yaps");

	return (
		<div className=" w-full max-w-[698px] flex flex-col gap-4 mx-auto h-full">
			{/* Tab headers */}
			<div className=" z-10   border-b bg-white px-4 py-0 rounded-b-md shadow-lg">
				<div className="flex gap-4">
					{["yaps", "followers", "following"].map((t) => (
						<button
							key={t}
							onClick={() => setTab(t)}
							className={`border-b-2 px-5 py-2 text-sm ${
								tab === t
									? "border-sky-600 font-medium text-sky-600"
									: "border-transparent text-gray-500 hover:text-black"
							}`}
						>
							{t[0].toUpperCase() + t.slice(1)}
						</button>
					))}
				</div>
			</div>

			{/* Tab content */}
			{tab === "yaps" && (
				<PostsFeed
					session={session}
					posts={initialPosts}
					nextCursor={null}
					loadMore={() => {}}
					loading={false}
					onDeleted={() => {}}
				/>
			)}

			{tab === "followers" && <UsersList items={followers} session={session} />}

			{tab === "following" && <UsersList items={following} session={session} />}
		</div>
	);
}
