// src/components/posts/Comments.jsx
"use client";

import {
	useActionState,
	useEffect,
	useRef,
	useState,
	useTransition,
} from "react";
import { addComment, deleteComment } from "@/lib/actions/posts-actions";
import { fetchComments } from "@/lib/helpers/fetch";
import { Avatar } from "../Avatar";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { MessageCircle, SendHorizontal, Share2, ThumbsUp } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import EmojiDropdown from "../EmojiDropdown";
import { useUser } from "../providers/user-context";
import LikeButton from "./LikeButton";

export default function Comments({ post, countLikes, countComments }) {
	const postId = post.id;

	const [items, setItems] = useState([]);
	const [state, formAction, pending] = useActionState(addComment, {
		ok: false,
	});
	const [nextCursor, setNextCursor] = useState(null);
	const [content, setContent] = useState("");
	const formRef = useRef(null);
	const [loadingMore, startTransition] = useTransition();
	const textareaRef = useRef(null);
	const viewer = useUser();

	const [showComments, setShowComments] = useState(false);

	// track whether we've fetched for this postId yet
	const loadedRef = useRef(false);
	const [initialLoading, setInitialLoading] = useState(false);

	const [commentCount, setCommentCount] = useState(Number(countComments));
	const [likeCount, setLikeCount] = useState(Number(countLikes));

	// Reset when post changes
	useEffect(() => {
		setItems([]);
		setNextCursor(null);
		loadedRef.current = false;
		// keep count in sync if parent prop changes
		setCommentCount(Number(countComments));
	}, [postId, countComments]);

	// Fetch only when shown (and only once per postId)
	useEffect(() => {
		if (!showComments || loadedRef.current) return;

		let ignore = false;
		(async () => {
			setInitialLoading(true);
			try {
				const { items, nextCursor } = await fetchComments({
					postId,
					limit: 10,
				});
				if (!ignore) {
					setItems(items);
					setNextCursor(nextCursor);
					loadedRef.current = true; // mark as loaded for this post
				}
			} finally {
				if (!ignore) setInitialLoading(false);
			}
		})();

		return () => {
			ignore = true;
		};
	}, [showComments, postId]);

	// When server action returns a new comment, prepend and bump count
	useEffect(() => {
		if (state.ok && state.comment) {
			setItems((prev) => [state.comment, ...prev]);
			setCommentCount((c) => c + 1);
			formRef.current?.reset();
			setContent("");
		}
	}, [state]);

	async function onDelete(id) {
		setItems((prev) => prev.filter((c) => c.id !== id));
		setCommentCount((c) => Math.max(0, c - 1));

		const fd = new FormData();
		fd.set("commentId", id);
		const res = await deleteComment(null, fd);
		if (!res?.ok) {
			// Optionally refetch to restore if delete failed
		}
	}

	async function loadMore() {
		if (!nextCursor) return;
		startTransition(async () => {
			const { items: more, nextCursor: nc } = await fetchComments({
				postId,
				limit: 10,
				cursor: nextCursor,
			});
			setItems((prev) => {
				const seen = new Set(prev.map((c) => c.id));
				const uniques = more.filter((c) => !seen.has(c.id));
				return [...prev, ...uniques];
			});
			setNextCursor(nc);
		});
	}

	function handleShowComments() {
		setShowComments((v) => !v);
	}

	function insertAtCaret(char) {
		const el = textareaRef.current;
		if (!el) return setContent((c) => c + char);
		const start = el.selectionStart ?? content.length;
		const end = el.selectionEnd ?? content.length;
		const next = content.slice(0, start) + char + content.slice(end);
		setContent(next);
		queueMicrotask(() => {
			el.focus();
			el.selectionStart = el.selectionEnd = start + char.length;
		});
	}
	function handleLikeCount(liked) {
		if (liked) {
			setLikeCount(likeCount + 1);
		} else {
			setLikeCount(likeCount - 1);
		}
	}

	return (
		<div className="relative space-y-2">
			<div className="flex flex-row justify-between">
				<div className="text-sm text-gray-500 ">
					{likeCount > 0 && (
						<span className="hover:underline cursor-pointer flex flex-row items-center gap-1">
							<ThumbsUp className="size-5 fill-white rounded-full bg-primary p-1 text-white" />
							{likeCount}
						</span>
					)}
				</div>

				<div className="text-sm text-gray-500">
					{commentCount > 0 && (
						<span
							className="hover:underline cursor-pointer"
							onClick={handleShowComments}
						>
							{commentCount} {commentCount === 1 ? "comment" : "comments"}
						</span>
					)}
				</div>
			</div>

			<div className="grid grid-cols-3 text-sm  border-t-1 border-muted py-1 dark:border-gray-500">
				<div>
					<LikeButton post={post} handleLikeCount={handleLikeCount}/>
				</div>
				<Button
					className="flex flex-row items-center justify-center gap-2 hover:underline cursor-pointer  p-2 "
					variant="ghost"
					onClick={handleShowComments}
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

			{showComments && (
				<div className="flex flex-col gap-2 pb-2 ">
					<Separator className="bg-muted my-2 dark:bg-gray-500" />
					<ScrollArea className="space-y-3 max-h-[200px] pt-2 overflow-auto">
						{items.map((c) => (
							<li key={c.id} className="flex gap-2 items-start w-fit px-2">
								<Avatar
									src={c.author?.image}
									alt="avatar"
									size={30}
									className="mt-1"
								/>
								<div className="flex-1 ">
									<div className="bg-muted rounded-md p-2 ">
										<div className="text-sm">
											<span className="font-medium">
												{c.author?.name || c.author?.email}
											</span>{" "}
											<span className="opacity-60">
												{new Date(c.createdAt).toLocaleString()}
											</span>
										</div>

										<div className="text-sm whitespace-pre-wrap">
											{c.content}
										</div>
									</div>
									{(viewer?.id === c.author?.id ||
										viewer?.role === "ADMIN") && (
										<button
											onClick={() => onDelete(c.id)}
											className="ml-2 text-xs opacity-70 hover:opacity-100"
										>
											Delete
										</button>
									)}
								</div>
							</li>
						))}
						{nextCursor && (
							<Button
								onClick={loadMore}
								disabled={loadingMore}
								className="self-start text-xs px-2 py-2  "
								variant="outline"
							>
								{loadingMore ? "Loading…" : "View more comments"}
							</Button>
						)}
					</ScrollArea>

					<Separator className="bg-muted my-2 dark:bg-gray-500" />
					<form
						ref={formRef}
						action={(fd) => {
							fd.set("postId", postId);
							return formAction(fd);
						}}
						className="flex gap-2"
					>
						<div className="flex flex-row w-full gap-2">
							<div className="w-fit">
								<Avatar src={viewer?.image} alt="avatar" size={40} />
							</div>
							<div className="flex flex-col w-full border border-muted bg-input rounded-md flex-1">
								<input
									ref={textareaRef}
									name="content"
									placeholder="Write a comment…"
									className="flex-1 px-3 py-2  rounded-b-none border-none shadow-none focus:outline-none focus:ring-0 focus:border-transparent text-[13px]"
									type="text"
									value={content}
									onChange={(e) => setContent(e.target.value)}
									required
								/>{" "}
								<Separator className="bg-muted my-1 dark:bg-gray-500" />
								<div className="flex justify-between items-center flex-row px-2">
									<EmojiDropdown onPick={insertAtCaret} />
									<Button
										className=" cursor-pointer w-8 text-sm rounded-full h-8  p-[2px] m-1 "
										disabled={pending}
										variant="default"
									>
										{pending ? "…" : <SendHorizontal className="size-4" />}
									</Button>
								</div>
							</div>
						</div>
					</form>
				</div>
			)}
		</div>
	);
}
