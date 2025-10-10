import FollowButton from "@/components/FollowButton";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageCirclePlusIcon, UserRoundX } from "lucide-react";

export default function ProfileCard({ u, canFollow, viewerId, author }) {
	return (
		<>
			<Card
				key={u.id}
				className=" p-0 rounded-2xl relative  border flex flex-col gap-3 items-center h-70 justify-between shadow-xl"
			>
				<div className=" w-full grid-cols-3 grid grid-rows-3  h-40">
					{/* cover */}
					<div className=" w-full bg-gradient-to-r  rounded-t-2xl from-sky-200 via-sky-200 to-gray-100 col-span-3 row-span-2 row-start-1 relative col-start-1">
						{/* optional real cover image */}
						{u.coverImageUrl && (
							<Image
								src={u.coverImageUrl}
								alt="Cover"
								fill
								className="object-cover rounded-t-2xl"
								sizes="(max-width: 768px) 100vw, 320px"
							/>
						)}
					</div>
					<div className="row-start-2 col-start-1 z-10 col-span-3 row-end-4 row-span-2 bg-card rounded-full m-auto border-5 border-card overflow-visible">
						<Avatar src={u.image} size={60} userId={u.id} />
					</div>
				</div>
				<div className="px-5   flex flex-col gap-1 items-center justify-between h-full pb-4 w-full">
					<div className="flex flex-col items-center">
						<Link
							href={`/user/${u.id}`}
							className="font-medium hover:underline text-center"
						>
							{u.name || "user"}
						</Link>
						<div className="text-xs text-muted-foreground text-center">
							<span className="font-semibold">{u._count.followers}</span>{" "}
							followers ·{" "}
							<span className="font-semibold">{u._count.following}</span>{" "}
							following
						</div>
					</div>
					<div className=" overflow-ellipsis h-full flex flex-col justify-center items-center max-h-11">
						{u.bio ? (
							<p className="text-sm text-muted-foreground line-clamp-3">
								{u.bio}
							</p>
						) : (
							<p className="text-sm text-muted-foreground line-clamp-3">
								No bio
							</p>
						)}
					</div>
					<div className="w-full flex justify-center h-12">
						{author ? (
							<div></div>
						) : canFollow ? (
							<div className="flex items-center gap-2 justify-center flex-row w-full ">
								<Link href={`/messages/${u.id}`}>
									<Button
										variant="default"
										className="rounded-full p-1 cursor-pointer text-xs size-8"
									>
										<MessageCirclePlusIcon />
									</Button>
								</Link>
								<FollowButton
									viewerId={viewerId}
									targetId={u.id}
									initialIsFollowing={u.isFollowedByMe}
									initialFollowsYou={u.followsMe}
									size="xs"
								/>
							</div>
						) : (
							<div className="flex items-center gap-2 justify-center flex-row w-full">
								<Button
									variant="secondary"
									className="cursor-auto text-sm"
									disabled
									size="sm"
								>
									Guest <UserRoundX />
								</Button>
							</div>
						)}
					</div>
				</div>
			</Card>
		</>
	);
}
