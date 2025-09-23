import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import FollowButton from "@/components/FollowButton";

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
		<main className="mx-auto max-w-5xl p-4">
			<h1 className="text-xl font-semibold mb-4">Discover people</h1>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{users.map((u) => {
					const handle = u.email?.split("@")[0] ?? "user";
					const canFollow =
						viewerId && viewerRole !== "GUEST" && u.role !== "GUEST";
					const isFollowing = followSet.has(u.id);
					const followsMe = backSet.has(u.id);

					return (
						<div
							key={u.id}
							className="rounded-2xl border bg-white p-4 flex flex-col gap-3"
						>
							<div className="flex items-center gap-3">
								<Image
									src={
										u.image ||
										`https://api.dicebear.com/7.x/bottts/png?seed=${u.id}&size=256`
									}
									alt={u.name || handle}
									width={48}
									height={48}
									className="rounded-full object-cover"
								/>
								<div className="flex-1">
									<Link
										href={`/user/${u.id}`}
										className="font-medium hover:underline"
									>
										{u.name || handle}
									</Link>
									<div className="text-xs text-gray-500">@{handle}</div>
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
							{u.bio && (
								<p className="text-sm text-gray-700 line-clamp-3">{u.bio}</p>
							)}
							<div className="text-xs text-gray-500">
								<span className="font-semibold">{u._count.followers}</span>{" "}
								followers ·{" "}
								<span className="font-semibold">{u._count.following}</span>{" "}
								following
							</div>
						</div>
					);
				})}
			</div>
		</main>
	);
}
