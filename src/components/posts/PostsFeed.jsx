"use client";

import { Card } from "../ui/card";
import PostMenu from "./PostMenu";
import { useState } from "react";
import Comments from "./Comments";
import { MessageCircle, Share2, ThumbsUp } from "lucide-react";
import LikeButton from "./LikeButton";
import { Avatar } from "../Avatar";
import Image from "next/image";
import { Button } from "../ui/button";
import Link from "next/link";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "../ui/hover-card";
import ProfileCard from "../profile/ProfileCard";

export default function PostsFeed({
	session,
	posts = [],
	nextCursor,
	loadMore,
	loading,
	onDeleted,
}) {
	const isAdmin = session?.user?.role === "ADMIN";

	const [openCommentsId, setOpenCommentsId] = useState(null);

	if (!posts.length) return <p className="opacity-70">No Yaps</p>;

	return (
		<div className="w-full max-w-[700px] space-y-3 flex flex-col items-center">
			{posts.map((p) => {
				const canFollow =
					session?.user?.id &&
					session?.user?.role !== "GUEST" &&
					p.author.role !== "GUEST";
				return (
					<Card
						className="shadow-lg flex flex-col p-5 w-full gap-2 pb-1"
						key={p.id}
					>
						<div className="flex justify-between items-center">
							<div className="flex items-center gap-3">
								<Avatar
									src={p.author.image}
									alt={p.author.name || p.author.email}
									size={35}
								/>
								<div className="flex flex-col">
									<HoverCard>
										<HoverCardTrigger>
											<div className="hover:underline cursor-pointer">
												{p.author.name || p.author.email}
											</div>
										</HoverCardTrigger>
										<HoverCardContent className="p-0 m-0 border-none rounded-xl">
											<ProfileCard
												u={p.author}
												canFollow={canFollow}
												viewerId={session?.user?.id}
											/>
										</HoverCardContent>
									</HoverCard>
									<span className="opacity-60 text-xs">
										{new Date(p.createdAt).toLocaleString()}
									</span>
								</div>
							</div>
							{(p.author.id === session?.user?.id || isAdmin) && (
								<PostMenu postId={p.id} onDeleted={onDeleted} />
							)}
						</div>
						{p.imageUrl && (
							<div className="relative w-full h-64 mt-2">
								<Image
									src={p.imageUrl}
									alt="Post image"
									fill
									className="object-contain rounded-lg"
									loading="lazy"
								/>
							</div>
						)}

						<div className="whitespace-pre-wrap text-sm mt-1">{p.content}</div>
						<div className="flex flex-row justify-between">
							<div className="text-sm text-gray-500 ">
								{p._count.likes > 0 && (
									<span className="hover:underline cursor-pointer flex flex-row items-center gap-1">
										<ThumbsUp className="size-5 fill-white rounded-full bg-sky-400 p-1 text-white" />
										{p._count.likes}
									</span>
								)}
							</div>

							<div className="text-sm text-gray-500">
								{p._count.comments > 0 && (
									<span
										onClick={() =>
											setOpenCommentsId((prev) => (prev === p.id ? null : p.id))
										}
										className="hover:underline cursor-pointer"
									>
										{p._count.comments}{" "}
										{p._count.comments === 1 ? "comment" : "comments"}
									</span>
								)}
							</div>
						</div>

						<div className="grid grid-cols-3 text-sm  border-t-1 border-muted py-1 dark:border-gray-500">
							<div>
								<LikeButton post={p} />
							</div>
							<Button
								onClick={() =>
									setOpenCommentsId((prev) => (prev === p.id ? null : p.id))
								}
								className="flex flex-row items-center justify-center gap-2 hover:underline cursor-pointer  p-2 "
								variant="ghost"
							>
								<MessageCircle className="size-4" />
								<span>Comment</span>
							</Button>
							<Button
								className="flex flex-row items-center justify-center gap-2 hover:underline cursor-pointer  p-2 "
								variant="ghost"
							>
								<Share2 className="size-4" />
								<span>Share</span>
							</Button>
						</div>

						{openCommentsId === p.id && (
							<Comments postId={p.id} session={session} />
						)}
					</Card>
				);
			})}

			<div className="pt-2">
				{nextCursor ? (
					<button
						onClick={loadMore}
						disabled={loading}
						className="px-4 py-2 rounded border"
					>
						{loading ? "Loading…" : "Load more"}
					</button>
				) : (
					<span className="opacity-60 text-sm">No more posts</span>
				)}
			</div>
		</div>
	);
}
