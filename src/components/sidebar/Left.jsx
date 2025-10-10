"use client";

import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { Avatar } from "../Avatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useUser } from "../providers/user-context";

// optional: your dicebear helper for fallbacks
const dicebearAvatar = (seed, size = 256, style = "bottts") =>
	`https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(
		seed
	)}&size=${size}`;

export default function SidebarProfile() {
	const user = useUser();
	const userId = user?.id;

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

	const followersCount = user._count.followers;

	const followingCount = user._count.following;

	const handle = user?.email ? user.email.split("@")[0] : "user";
	const profileHref = `/user/${user?.id ?? ""}`;

	const avatar = user?.image || dicebearAvatar(userId);
	const cover = user?.coverImageUrl;

	return (
		<aside className="w-full p-5 max-w-100 overflow-y-auto max-h-[93vh] space-y-8">
			<Card className="relative rounded-2xl  shadow-lg border overflow-hidden  pb-5 pt-0">
				<div className=" w-full grid-cols-3 grid grid-rows-3  h-40">
					{/* cover */}
					<div className="  w-full bg-gradient-to-r from-sky-200 via-sky-200 to-gray-100 col-span-3 row-span-2 row-start-1 relative col-start-1">
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
					</div>
					<div className="row-start-2 col-start-1 z-10 col-span-3 row-end-4 row-span-2 bg-card rounded-full border-5 border-card flex self-center justify-self-center">
						<div>
							<Avatar src={avatar} size={90} userId={user.id} dotSize={5}/>
						</div>
					</div>
				</div>

				<div className="px-6 space-y-4 ">
					{/* name / handle */}
					<div className=" text-center">
						<div className="text-lg font-semibold ">{user?.name || handle}</div>
					</div>

					{/* stats */}
					<div className="flex items-center justify-center gap-6 text-center">
						<div>
							<div className="text-lg font-semibold ">{followersCount}</div>
							<div className="text-xs text-muted-foreground">Followers</div>
						</div>
						<div className="h-7 w-[1px] bg-muted-foreground" />
						<div>
							<div className="text-lg font-semibold ">{followingCount}</div>
							<div className="text-xs text-muted-foreground">Following</div>
						</div>
					</div>

					{/* bio */}
					{user?.bio ? (
						<div className="mt-1 rounded-xl  px-4 py-3 text-sm  text-center text-muted-foreground">
							{user.bio}
						</div>
					) : (
						<div className="mt-1 rounded-xl  px-4 py-3 text-sm 	text-center text-muted-foreground">
							No bio yet
						</div>
					)}

					{/* profile button */}
					<div className="mt-4 flex justify-center">
						<Link href={profileHref}>
							<Button className="cursor-pointer">My Profile</Button>
						</Link>
					</div>
				</div>
			</Card>
			<div className="p-4 border-t-2 mt-4 border-muted dark:border-gray-500">
				<h1 className="font-bold">Skills:</h1>
				{/* skills */}
				{Array.isArray(user?.skills) && user.skills.length > 0 ? (
					<div className="mt-6 ">
						<div className="flex flex-wrap gap-2">
							{user.skills.map((s, i) => (
								<Badge key={`${s}-${i}`}>{s}</Badge>
							))}
						</div>
					</div>
				) : (
					<div className="mt-4">No skills yet</div>
				)}
			</div>
			<div className="border-t-2  border-muted p-4 dark:border-gray-500">
				<h1 className="font-bold">Communities:</h1>
			</div>
		</aside>
	);
}
