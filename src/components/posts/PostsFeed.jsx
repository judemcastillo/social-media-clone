"use client";

import { Card } from "../ui/card";
import PostMenu from "./PostMenu";
import { useEffect, useState, useCallback } from "react";
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
import { useUser } from "../providers/user-context";

export default function PostsFeed({
	posts = [],
	nextCursor,
	loadMore,
	loading,
	onDeleted,
}) {
	const viewer = useUser();
	const isAdmin = viewer?.role === "ADMIN";

	if (!posts.length) return <p className="opacity-70">No Yaps</p>;

	return (
		<div className="w-full max-w-[700px] space-y-3 flex flex-col items-center">
			{posts.map((p) => {
				const canFollow =
					viewer?.id && viewer?.role !== "GUEST" && p.author.role !== "GUEST";
				const author = viewer?.id === p.author.id;

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
												viewerId={viewer?.id}
												author={author}
											/>
										</HoverCardContent>
									</HoverCard>
									<span className="opacity-60 text-xs">
										{new Date(p.createdAt).toLocaleString()}
									</span>
								</div>
							</div>
							{(author || isAdmin) && (
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
									unoptimized
								/>
							</div>
						)}

						<div className="whitespace-pre-wrap text-sm mt-1">{p.content}</div>
						<Comments
							countLikes={p._count.likes}
							countComments={p._count.comments}
							post={p}
						/>
					</Card>
				);
			})}

			<div className="pt-2">
				{nextCursor ? (
					<Button
						onClick={loadMore}
						disabled={loading}
						className="px-4 py-2 cursor-pointer"
						variant="link"
					>
						{loading ? "Loading…" : "Load more"}
					</Button>
				) : (
					<span className="opacity-60 text-sm">No more posts</span>
				)}
			</div>
		</div>
	);
}
