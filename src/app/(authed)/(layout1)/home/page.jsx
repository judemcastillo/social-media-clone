"use server";
import { auth } from "@/auth";
import PostForm from "@/components/posts/CreatePost";
import PostsFeed from "@/components/posts/PostsFeed";
import HomeClient from "./HomeClient";
import prisma from "@/lib/prisma";
import { fetchPosts, fetchPostsServer } from "@/lib/helpers/fetch";

export default async function Home() {
	const session = await auth();
	const me = session?.user?.id;
	const { posts, nextCursor } = await fetchPostsServer(me);
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
