"use client";

import { useEffect, useState, useTransition } from "react";
import PostForm from "@/components/posts/CreatePost";
import PostsFeed from "@/components/posts/PostsFeed";
import { fetchPosts } from "@/lib/helpers/fetch";

export default function HomeClient({
	initialPosts,
	pageSize = 10,
	initialNextCursor = null,
}) {
	const [posts, setPosts] = useState(initialPosts);
	const [nextCursor, setNextCursor] = useState(initialNextCursor);
	const [isPending, startTransition] = useTransition();

	// initial load (client-side)
	// useEffect(() => {
	// 	(async () => {
	// 		const { posts, nextCursor } = await fetchPosts({ limit: pageSize });
	// 		setPosts(posts);
	// 		setNextCursor(nextCursor);
	// 	})();
	// }, [pageSize]);

	// create handler: prepend new post
	function handleCreated(post) {
		setPosts((prev) =>
			prev.some((p) => p.id === post.id) ? prev : [post, ...prev]
		);
	}

	// delete handler: remove from list
	function handleDeleted(id) {
		setPosts((prev) => prev.filter((p) => p.id !== id));
	}

	// pagination
	function loadMore() {
		if (!nextCursor) return;
		startTransition(async () => {
			const { posts: more, nextCursor: nc } = await fetchPosts({
				limit: pageSize,
				cursor: nextCursor,
			});
			setPosts((prev) => {
				const seen = new Set(prev.map((p) => p.id));
				const uniques = more.filter((p) => !seen.has(p.id));
				return [...prev, ...uniques];
			});
			setNextCursor(nc);
		});
	}

	return (
		<main className="flex h-[93vh] flex-col items-center justify-start pt-5 gap-7 w-full overflow-y-auto ">
			<PostForm onCreated={handleCreated} />
			<div className="overflow-y-auto w-full flex flex-col items-center pb-10 scrollbar-none">
				<PostsFeed
					posts={posts}
					nextCursor={nextCursor}
					loadMore={loadMore}
					loading={isPending}
					onDeleted={handleDeleted}
				/>
			</div>
		</main>
	);
}
