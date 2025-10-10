"use client";

import { useState, useTransition } from "react";
import PostsFeed from "@/components/posts/PostsFeed";
import Link from "next/link";
import FollowButton from "@/components/FollowButton";
import { Avatar } from "../Avatar";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import {
	loadMoreFollowersAction,
	loadMoreFollowingAction,
	loadMorePostsAction,
} from "@/lib/actions/profile-actions";

function UsersList({ items = [], session, onLoadMore, loading, hasMore }) {
	if (!items.length)
		return (
			<Card>
				<div className="text-sm text-center">No users yet.</div>
			</Card>
		)

	return (
		<div className="space-y-3 flex flex-col items-center w-full">
			<ul className="space-y-2 w-full">
				{items.map((u) => {
					const canFollow =
						session?.user?.id &&
						session?.user?.role !== "GUEST" &&
						u.role !== "GUEST" &&
						u.id !== session?.user?.id;

					return (
						<Card
							key={u.id}
							className="flex items-center justify-between shadow-lg  p-3 flex-row w-full"
						>
							<div className="flex items-center gap-3">
								<Avatar src={u.image} size={35} userId={u.id} />
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

			{hasMore && (
				<div className="pt-2 mx-auto">
					<Button
						onClick={onLoadMore}
						disabled={loading}
						className="px-4 py-2 cursor-pointer"
						variant="link"
					>
						{loading ? "Loading…" : "Load more"}
					</Button>
				</div>
			)}
		</div>
	);
}

export default function ProfileTabs({
	session,
	initialPosts,
	nextCursor,
	userId,

	followers,
	followersNextCursor,
	following,
	followingNextCursor,
}) {
	const [tab, setTab] = useState("yaps");

	// 👇 POSTS paging state
	const [postItems, setPostItems] = useState(initialPosts || []);
	const [postCursor, setPostCursor] = useState(nextCursor || null);
	const [loadingPosts, startPosts] = useTransition();

	const loadMorePosts = () => {
		if (!postCursor || !loadMorePostsAction) return;
		startPosts(async () => {
			const res = await loadMorePostsAction({ cursor: postCursor, userId });
			if (!res?.ok) return;
			setPostItems((prev) => {
				const seen = new Set(prev.map((p) => p.id));
				const uniques = res.posts.filter((p) => !seen.has(p.id));
				return [...prev, ...uniques];
			});
			setPostCursor(res.nextCursor);
		});
	};

	// followers paging state
	const [followersItems, setFollowersItems] = useState(followers || []);
	const [followersCursor, setFollowersCursor] = useState(
		followersNextCursor || null
	);
	const [loadingFollowers, startFollowers] = useTransition();

	// following paging state
	const [followingItems, setFollowingItems] = useState(following || []);
	const [followingCursor, setFollowingCursor] = useState(
		followingNextCursor || null
	);
	const [loadingFollowing, startFollowing] = useTransition();

	const loadMoreFollowers = () => {
		if (!followersCursor || !loadMoreFollowersAction) return;
		startFollowers(async () => {
			const res = await loadMoreFollowersAction({
				cursor: followersCursor,
				userId,
			});
			if (!res?.ok) return;
			setFollowersItems((prev) => {
				const seen = new Set(prev.map((u) => u.id));
				const uniques = res.items.filter((u) => !seen.has(u.id));
				return [...prev, ...uniques];
			});
			setFollowersCursor(res.nextCursor);
		});
	};

	const loadMoreFollowing = () => {
		if (!followingCursor || !loadMoreFollowingAction) return;
		startFollowing(async () => {
			const res = await loadMoreFollowingAction({
				cursor: followingCursor,
				userId,
			});
			if (!res?.ok) return;
			setFollowingItems((prev) => {
				const seen = new Set(prev.map((u) => u.id));
				const uniques = res.items.filter((u) => !seen.has(u.id));
				return [...prev, ...uniques];
			});
			setFollowingCursor(res.nextCursor);
		});
	};

	return (
		<div className=" w-full max-w-[700px] flex flex-col gap-4 mx-auto h-full">
			{/* Tab headers */}
			<Card className=" z-10   border-b bg-card px-4 py-0 rounded-t-none shadow-lg">
				<div className="flex gap-4">
					{["yaps", "followers", "following"].map((t) => (
						<button
							key={t}
							onClick={() => setTab(t)}
							className={`border-b-2 px-5 py-2 text-sm  cursor-pointer ${
								tab === t
									? "border-primary font-medium text-primary"
									: "border-transparent text-gray-500 hover:text-foreground-muted hover:border-gray-300"
							}`}
						>
							{t[0].toUpperCase() + t.slice(1)}
						</button>
					))}
				</div>
			</Card>

			{/* Tab content */}
			{tab === "yaps" && (
				<PostsFeed
					session={session}
					posts={postItems}
					nextCursor={nextCursor}
					loadMore={loadMorePosts} // 👈 NEW
					loading={loadingPosts}
					onDeleted={() => {}}
				/>
			)}

			{tab === "followers" && (
				<UsersList
					items={followersItems}
					session={session}
					hasMore={!!followersCursor}
					loading={loadingFollowers}
					onLoadMore={loadMoreFollowers}
				/>
			)}

			{tab === "following" && (
				<UsersList
					items={followingItems}
					session={session}
					hasMore={!!followingCursor}
					loading={loadingFollowing}
					onLoadMore={loadMoreFollowing}
				/>
			)}
		</div>
	);
}
