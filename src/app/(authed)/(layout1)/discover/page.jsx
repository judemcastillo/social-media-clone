import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import DiscoverList from "@/components/discover/DiscoverList";

export const dynamic = "force-dynamic";

const LIMIT = 12;

export default async function DiscoverPage() {
	const session = await auth();
	const viewerId = session?.user?.id ?? null;
	const viewerRole = session?.user?.role ?? "USER";

	const rows = await prisma.user.findMany({
		where: { id: { not: viewerId } },
		take: LIMIT + 1,
		orderBy: [
			{ followers: { _count: "desc" } },
			{ following: { _count: "desc" } },
			{ id: "desc" },
		],
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

	let nextCursor = null;
	if (rows.length > LIMIT) nextCursor = rows[rows.length - 1].id;
	const users = rows.slice(0, LIMIT);

	// follow flags for initial batch
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

	const initialUsers = users.map((u) => ({
		...u,
		isFollowedByMe: followSet.has(u.id),
		followsMe: backSet.has(u.id),
	}));

	return (
		<main className="mx-auto max-w-[700px] py-4 max-h-[93vh] overflow-y-auto scrollbar-none w-full">
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
