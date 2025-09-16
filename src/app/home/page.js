"use server";

import { auth } from "@/auth";
import PostForm from "@/components/posts/CreatePost";
import PostsFeed from "@/components/posts/PostsFeed";
import { ScrollBar } from "@/components/ui/scroll-area";
import { ScrollArea } from "@radix-ui/react-scroll-area";

export default async function Home() {
	const session = await auth();
	if (session?.user) {
		return (
			<main className="flex h-[93vh] flex-col items-center justify-start pt-5 gap-7 w-full ">
				<PostForm session={session} />
				<div className="overflow-y-auto w-full flex flex-col items-center scrollbar-none pb-10">
					<PostsFeed />
					
				</div>
			</main>
		);
	}
	return (
		<main className="flex min-h-screen flex-col items-center justify-start p-24">
			<p className="text-2xl">You are not signed in</p>
		</main>
	);
}
