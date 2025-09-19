"use server";
import { auth } from "@/auth";
import PostForm from "@/components/posts/CreatePost";
import PostsFeed from "@/components/posts/PostsFeed";
import HomeClient from "./HomeClient";

export default async function Home() {
	const session = await auth();
	if (session?.user) {
		return (
			<>
				<HomeClient session={session} />
			</>
		);
	}
	return (
		<main className="flex min-h-screen flex-col items-center justify-start p-24">
			<p className="text-2xl">You are not signed in</p>
		</main>
	);
}
