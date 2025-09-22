import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { Avatar } from "../Avatar";

// optional: your dicebear helper for fallbacks
const dicebearAvatar = (seed, size = 256, style = "bottts") =>
	`https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(
		seed
	)}&size=${size}`;

export default async function SidebarProfile() {
	const session = await auth();
	const userId = session?.user?.id;

	if (!userId) {
		// not signed in — show a minimal placeholder card
		return (
			<aside className="w-full">
				<div className="rounded-2xl bg-white shadow-sm border p-6">
					<div className="text-sm text-gray-500">You’re not signed in.</div>
					<Link
						href="/login"
						className="mt-3 inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
					>
						Sign in
					</Link>
				</div>
			</aside>
		);
	}

	// fetch user + counts (followers/following)
	const [user, followersCount, followingCount] = await Promise.all([
		prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				name: true,
				email: true,
				image: true,
				bio: true,
				skills: true, // String[] in your schema
				coverImageUrl: true, // rename if your field is different
				role: true,
			},
		}),
		prisma.follow.count({ where: { followingId: userId } }),
		prisma.follow.count({ where: { followerId: userId } }),
	]);

	const handle = user?.email ? user.email.split("@")[0] : "user";
	const profileHref = `/user/${user?.id ?? ""}`;

	const avatar = user?.image || dicebearAvatar(userId);
	const cover = user?.coverImageUrl;

	return (
		<aside className="w-full p-5">
			<div className="relative rounded-2xl bg-white shadow-lg border overflow-hidden  max-w-[350px]">
				{/* cover */}
				<div className="relative h-28 w-full bg-gradient-to-r from-sky-200 via-sky-200 to-gray-100">
					{/* optional real cover image */}
					{cover && (
						<Image
							src={cover}
							alt="Cover"
							fill
							className="object-cover"
							sizes="(max-width: 768px) 100vw, 320px"
						/>
					)}

					{/* decorative arc behind avatar */}
					<div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
						<div className="relative h-28 w-28">
							<div className="absolute inset-0 rounded-full bg-white  ">
								<Avatar src={avatar} size={90} className="size-24 m-2 " />
							</div>
						
						</div>
					</div>
				</div>

				<div className="px-6 pt-5">
					<div className="mx-auto h-24 w-24 -mt-14 rounded-full ring-4 ring-white overflow-hidden shadow"></div>

					{/* name / handle */}
					<div className=" text-center">
						<div className="text-base font-semibold text-gray-900">
							{user?.name || handle}
						</div>
						
					</div>

					{/* stats */}
					<div className="mt-4 flex items-center justify-center gap-6 text-center">
						<div>
							<div className="text-lg font-semibold text-gray-900">
								{followersCount}
							</div>
							<div className="text-xs text-gray-500">Followers</div>
						</div>
						<div className="h-7 w-px bg-gray-200" />
						<div>
							<div className="text-lg font-semibold text-gray-900">
								{followingCount}
							</div>
							<div className="text-xs text-gray-500">Following</div>
						</div>
					</div>

					{/* bio */}
					{user?.bio && (
						<div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
							{user.bio}
						</div>
					)}

					{/* profile button */}
					<div className="mt-4 flex justify-center">
						<Link
							href={profileHref}
							className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
						>
							My Profile
						</Link>
					</div>

					{/* skills */}
					{Array.isArray(user?.skills) && user.skills.length > 0 && (
						<div className="mt-6">
							<div className="mb-2 text-sm font-medium text-gray-900">
								Skills
							</div>
							<div className="flex flex-wrap gap-2">
								{user.skills.map((s, i) => (
									<span
										key={`${s}-${i}`}
										className="rounded-full border bg-white px-3 py-1 text-xs text-gray-700 shadow-sm"
									>
										{s}
									</span>
								))}
							</div>
						</div>
					)}

					{/* spacer */}
					<div className="h-4" />
				</div>
			</div>
		</aside>
	);
}
