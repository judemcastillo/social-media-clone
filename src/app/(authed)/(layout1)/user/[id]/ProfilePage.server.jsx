import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { Card, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquareMore } from "lucide-react";
import FollowButton from "@/components/FollowButton";
import ProfileTabs from "@/components/profile/ProfileTabs";

import fetchOneUserAction from "@/lib/actions/discover-actions";
import { fetchUserFeed } from "@/lib/actions/posts-actions";
import {
	fetchFollowersPage,
	fetchFollowingPage,
} from "@/lib/actions/profile-actions";

export default async function ProfilePageServer({ userId }) {
	const session = await auth();
	const viewerId = session?.user?.id ?? null;
	const viewerRole = session?.user?.role ?? "USER";

	const { user } = await fetchOneUserAction(userId);
	if (!user) {
		return (
			<Card className="w-full  rounded-t-xl  mt-8 shadow-lg flex flex-col p-6 items-center">
				<CardTitle>User not found.</CardTitle>
			</Card>
		);
	}

	const { posts, nextCursor, isFollowedByMe, followsMe } = await fetchUserFeed({
		userId,
	});

	const [followersPage, followingPage] = await Promise.all([
		fetchFollowersPage({ userId, limit: 12 }),
		fetchFollowingPage({ userId, limit: 12 }),
	]);

	const followers = followersPage.ok ? followersPage.items : [];
	const followersCursor = followersPage.ok ? followersPage.nextCursor : null;

	const following = followingPage.ok ? followingPage.items : [];
	const followingCursor = followingPage.ok ? followingPage.nextCursor : null;

	const handle = user.email?.split("@")[0] ?? "user"; // <-- was missing in your code

	return (
		<main className=" max-h-[93vh] overflow-y-auto  mx-auto flex flex-col items-center w-full scrollbar-none">
			<div className="max-w-[700px] w-full px-5 md:px-0 pb-10">
				{/* cover */}
				<Card className="w-full  rounded-t-xl border-t-0 mt-8 shadow-lg flex flex-col pb-0 rounded-b-none pt-0">
					<div className="grid grid-cols-4 grid-rows-3 w-full h-55">
						<div className="relative col-span-4 w-full row-span-2 row-start-1 col-start-1 bg-gray-100 overflow-hidden px-0 rounded-t-xl bg-gradient-to-r from-sky-200 via-sky-200 to-gray-100">
							{user.coverImageUrl && (
								<Image
									src={user.coverImageUrl}
									alt="Cover"
									fill
									className="object-cover"
								/>
							)}
						</div>
						<div className="row-span-2 col-span-1 m-auto col-start-1 row-start-2 bg-card rounded-full border-3  border-card w-fit z-50 -translate-x-4">
							<Avatar src={user.image} size={100} />
						</div>
						<div className="col-start-4 row-start-3 row-span-1 col-span-1 z-60 m-auto">
							{viewerId === user.id && session?.user?.role !== "GUEST" ? (
								<Link href={`/user/${user.id}/edit`}>
									<Button variant="secondary" className="text-[13px]">
										Edit profile
									</Button>
								</Link>
							) : (
								viewerId &&
								viewerRole !== "GUEST" &&
								user.role !== "GUEST" && (
									<div className="flex items-center gap-3">
										<Link href={`/messages/${user.id}`}>
											<Button className="cursor-pointer rounded-full p-1 size-9">
												<MessageSquareMore />
											</Button>
										</Link>
										<FollowButton
											viewerId={viewerId}
											targetId={user.id}
											initialIsFollowing={isFollowedByMe}
											initialFollowsYou={followsMe}
										/>
									</div>
								)
							)}
						</div>
					</div>

					<div className="px-8 space-y-3 -translate-y-10 ">
						<div>
							<h1 className="text-xl font-semibold">{user.name || handle}</h1>
						</div>

						{user.bio ? (
							<div className=" text-sm text-muted-foreground">{user.bio}</div>
						) : (
							<div className="   text-sm text-muted-foreground">No bio yet</div>
						)}

						{user.skills?.length ? (
							<section>
								<div className="flex flex-wrap gap-2 items-center">
									<h2 className=" text-sm font-medium">Skills:</h2>
									{user.skills.map((s, i) => (
										<Badge key={i}>{s}</Badge>
									))}
								</div>
							</section>
						) : null}

						<div className="mt-2 flex items-center gap-6 text-sm">
							<div>
								<span className="font-semibold">{user._count.followers}</span>{" "}
								Followers
							</div>
							<div>
								<span className="font-semibold">{user._count.following}</span>{" "}
								Following
							</div>
						</div>
					</div>
				</Card>

				{/* Tabs */}
				<ProfileTabs
					session={session}
					initialPosts={posts}
					nextCursor={nextCursor}
					followers={followers}
					followersNextCursor={followersCursor}
					following={following}
					followingNextCursor={followingCursor}
					userId={userId}
				/>
			</div>
		</main>
	);
}
