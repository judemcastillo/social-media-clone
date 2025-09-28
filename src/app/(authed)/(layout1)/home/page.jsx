"use server";
import { auth } from "@/auth";

import HomeClient from "./HomeClient";

import { fetchFeed } from "@/lib/actions/posts-actions";

export default async function Home() {
	const session = await auth();
	const me = session?.user?.id;
	const { posts, nextCursor } = await fetchFeed();
	const initialPosts = posts;
	const initialNextCursor = nextCursor;

	if (session?.user) {
		return (
			<>
				<HomeClient
					initialPosts={initialPosts}
					initialNextCursor={initialNextCursor}
				/>
			</>
		);
	}
	return (
		<main className="flex min-h-screen flex-col items-center justify-start p-24">
			<p className="text-2xl">You are not signed in</p>
		</main>
	);
}
