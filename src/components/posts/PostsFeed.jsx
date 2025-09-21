"use client";

import { Card } from "../ui/card";
import Image from "next/image";
import PostMenu from "./PostMenu";
import { useState } from "react";
import Comments from "./Comments";
import { MessageCircle, Share2, ThumbsUp } from "lucide-react";
import LikeButton from "./LikeButton";
import { Avatar } from "../Avatar";

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

	if (!posts.length) return <p className="opacity-70">Loading</p>;

	return (
		<div className="w-full max-w-[700px] space-y-3 flex flex-col items-center">
			{posts.map((p) => (
				<Card
					className="shadow-lg flex flex-col p-5 w-full gap-2 pb-1"
					key={p.id}
				>
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-3">
							<Avatar src={p.author.image} alt={p.author.name || p.author.email} size={35} />
							<div className="flex flex-col">
								{p.author.name || p.author.email}
								<span className="opacity-60 text-xs">
									{new Date(p.createdAt).toLocaleString()}
								</span>
							</div>
						</div>
						{(p.author.id === session?.user?.id || isAdmin) && (
							<PostMenu postId={p.id} onDeleted={onDeleted} />
						)}
					</div>

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

					<div className="grid grid-cols-3 text-sm border-t-2  py-1 ">
						<div>
							<LikeButton post={p} />
						</div>
						<button
							onClick={() =>
								setOpenCommentsId((prev) => (prev === p.id ? null : p.id))
							}
							className="flex flex-row items-center justify-center gap-2 hover:underline cursor-pointer hover:bg-gray-100 p-2 rounded"
						>
							<MessageCircle className="size-4" />
							<span>Comment</span>
						</button>
						<button className="flex flex-row items-center justify-center gap-2 hover:underline cursor-pointer hover:bg-gray-100 p-2 rounded">
							<Share2 className="size-4" />
							<span>Share</span>
						</button>
					</div>

					{openCommentsId === p.id && (
						<Comments postId={p.id} session={session} />
					)}
				</Card>
			))}

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
