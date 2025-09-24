import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import FollowButton from "@/components/FollowButton";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
	const session = await auth();
	const viewerId = session?.user?.id ?? null;
	const viewerRole = session?.user?.role ?? "USER";

	// grab a batch of users excluding self
	const users = await prisma.user.findMany({
		where: { id: { not: viewerId } },
		take: 24,
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			name: true,
			email: true,
			image: true,
			role: true,
			bio: true,
			coverImageUrl: true,
			_count: { select: { followers: true, following: true } },
		},
	});

	// compute follow flags (batch)
	let followSet = new Set();
	let backSet = new Set();

	if (viewerId && users.length) {
		const ids = users.map((u) => u.id);
		const edges = await prisma.follow.findMany({
			where: {
				OR: [
					{ followerId: viewerId, followingId: { in: ids } },
					{ followerId: { in: ids }, followingId: viewerId },
				],
			},
			select: { followerId: true, followingId: true },
		});
		followSet = new Set(
			edges.filter((e) => e.followerId === viewerId).map((e) => e.followingId)
		);
		backSet = new Set(
			edges.filter((e) => e.followingId === viewerId).map((e) => e.followerId)
		);
	}

	return (
		<main className="mx-auto max-w-[700px] py-4 max-h-[93vh] overflow-y-auto scrollbar-none w-full">
			<h1 className="text-xl font-semibold mb-4">Discover Yappers</h1>
			<div className="grid sm:grid-cols-3 sm:gap-4 grid-cols-2 gap-1">
				{users.map((u) => {
					const canFollow =
						viewerId && viewerRole !== "GUEST" && u.role !== "GUEST";
					const isFollowing = followSet.has(u.id);
					const followsMe = backSet.has(u.id);

					return (
						<Card key={u.id} className=" p-0 flex flex-col gap-3 items-center h-70">
							<div className=" w-full grid-cols-3 grid grid-rows-3  h-30 ">
								<div className="w-full bg-gradient-to-r from-sky-200 via-sky-200 to-gray-100 col-span-3 row-span-2 row-start-1 relative col-start-1 rounded-t-lg">
									{u.coverImageUrl && (
										<Image
											src={u.coverImageUrl}
											alt="Cover"
											fill
											className="object-cover"
											sizes="(max-width: 768px) 100vw, 320px"
										/>
									)}
								</div>
								<div className="row-start-2 col-start-1 z-10 col-span-3 row-end-4 row-span-2 bg-card rounded-full m-auto border-5 border-card overflow-visible">
									<Avatar src={u.image} size={60} />
								</div>
							</div>
							<div className="px-4 pb-4  flex flex-col gap-1 items-center">
								<div className="flex-1">
									<Link
										href={`/user/${u.id}`}
										className="font-medium hover:underline"
									>
										{u.name || "user"}
									</Link>
								</div>

								{u.bio && (
									<p className="text-sm text-gray-700 line-clamp-3">{u.bio}</p>
								)}
								<div className="text-xs text-gray-500">
									<span className="font-semibold">{u._count.followers}</span>{" "}
									followers ·{" "}
									<span className="font-semibold">{u._count.following}</span>{" "}
									following
								</div>
								{canFollow && (
									<FollowButton
										viewerId={viewerId}
										targetId={u.id}
										initialIsFollowing={isFollowing}
										initialFollowsYou={followsMe}
										size="sm"
									/>
								)}
							</div>
						</Card>
					);
				})}
			</div>
		</main>
	);
}
