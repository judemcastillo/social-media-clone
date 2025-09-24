import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import ProfileTabs from "@/components/profile/ProfileTabs";
import FollowButton from "@/components/FollowButton";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquareMore } from "lucide-react";


export const dynamic = "force-dynamic";

export default async function UserProfilePage({ params: p }) {
	const params = await p;
	const session = await auth();
	const viewerId = session?.user?.id ?? null;
	const viewerRole = session?.user?.role ?? "USER";
	const id = params.id;

	const user = await prisma.user.findUnique({
		where: { id },
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			image: true,
			coverImageUrl: true,
			bio: true,
			skills: true,
			_count: { select: { followers: true, following: true } },
		},
	});
	if (!user) return <div className="p-6">User not found.</div>;

	// posts by this user (first page)
	const rows = await prisma.post.findMany({
		where: { authorId: id },
		take: 20,
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			content: true,
			imageUrl: true,
			createdAt: true,
			authorId: true,
			author: { select: { id: true, name: true, email: true, image: true } },
			_count: { select: { likes: true, comments: true } },
		},
	});

	// likedByMe map for viewer
	let likedMap = {};
	if (viewerId && rows.length) {
		const likes = await prisma.like.findMany({
			where: { userId: viewerId, postId: { in: rows.map((r) => r.id) } },
			select: { postId: true },
		});
		likedMap = Object.fromEntries(likes.map((l) => [l.postId, true]));
	}
	const posts = rows.map((r) => ({ ...r, likedByMe: !!likedMap[r.id] }));

	// followers list (users who follow THIS user)
	const followerEdges = await prisma.follow.findMany({
		where: { followingId: id },
		select: {
			follower: {
				select: { id: true, name: true, email: true, image: true, role: true },
			},
		},
	});
	const followersUsers = followerEdges.map((e) => e.follower);

	// following list (users THIS user follows)
	const followingEdges = await prisma.follow.findMany({
		where: { followerId: id },
		select: {
			following: {
				select: { id: true, name: true, email: true, image: true, role: true },
			},
		},
	});
	const followingUsers = followingEdges.map((e) => e.following);

	// compute follow flags for lists relative to the viewer (batch)
	async function attachFollowFlags(list) {
		if (!viewerId || !list.length) return list;
		const ids = list.map((u) => u.id).filter((x) => x !== viewerId);
		if (!ids.length) return list;

		const edges = await prisma.follow.findMany({
			where: {
				OR: [
					{ followerId: viewerId, followingId: { in: ids } }, // me -> them
					{ followerId: { in: ids }, followingId: viewerId }, // them -> me
				],
			},
			select: { followerId: true, followingId: true },
		});

		const isFollowing = new Set(
			edges.filter((e) => e.followerId === viewerId).map((e) => e.followingId)
		);
		const followsMe = new Set(
			edges.filter((e) => e.followingId === viewerId).map((e) => e.followerId)
		);

		return list.map((u) => ({
			...u,
			isFollowedByMe: isFollowing.has(u.id),
			followsMe: followsMe.has(u.id),
		}));
	}

	const [followers, following] = await Promise.all([
		attachFollowFlags(followersUsers),
		attachFollowFlags(followingUsers),
	]);

	const handle = user.email?.split("@")[0] ?? "user";

	// follow flags for header button
	let isFollowedByMe = false;
	let followsMe = false;
	if (
		viewerId &&
		viewerId !== id &&
		viewerRole !== "GUEST" &&
		user.role !== "GUEST"
	) {
		const [a, b] = await Promise.all([
			prisma.follow.findUnique({
				where: {
					followerId_followingId: { followerId: viewerId, followingId: id },
				},
				select: { followerId: true },
			}),
			prisma.follow.findUnique({
				where: {
					followerId_followingId: { followerId: id, followingId: viewerId },
				},
				select: { followerId: true },
			}),
		]);
		isFollowedByMe = !!a;
		followsMe = !!b;
	}

	return (
		<main className=" max-h-[93vh] overflow-y-auto  mx-auto flex flex-col items-center w-full scrollbar-none">
			<div className="max-w-[700px] w-full px-5 md:px-0 ">
				{/* cover */}
				<Card className="w-full  rounded-t-xl border bpt-0 mt-8 shadow-lg flex flex-col pb-0 rounded-b-none pt-0">
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
								session?.user?.role !== "GUEST" &&
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
						{/* header */}
						<div className="">
							<div className=" ">
								<h1 className="text-xl font-semibold">{user.name || handle}</h1>
							</div>
						</div>

						{/* bio */}
						{user.bio ? (
							<div className=" text-sm text-muted-foreground">{user.bio}</div>
						) : (
							<div className="   text-sm text-muted-foreground">No bio yet</div>
						)}

						{/* skills */}
						{user.skills?.length ? (
							<section>
								<div className="flex flex-wrap gap-2 items-center">
									<h2 className=" text-sm font-medium">Skills:</h2>
									{user.skills.map((s, i) => (
										<Badge key={i}>{s}</Badge>
									))}
								</div>
							</section>
						) : (
							<></>
						)}
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
					followers={followers}
					following={following}
				/>
			</div>
		</main>
	);
}
