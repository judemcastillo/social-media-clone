"use server";
import { auth } from "@/auth";
import PostForm from "@/components/posts/CreatePost";
import PostsFeed from "@/components/posts/PostsFeed";
import HomeClient from "./HomeClient";
import prisma from "@/lib/prisma";

export default async function Home() {
	const session = await auth();
	const me = session?.user?.id;
	const user = await prisma.user.findUnique({
		where: { id: me },
		select: {
			id: true,
			name: true,
			bio: true,
			skills: true,
			image: true,
			coverImageUrl: true,
		},
	});

	if (session?.user) {
		return (
			<>
				<HomeClient session={session} user={user} />
			</>
		);
	}
	return (
		<main className="flex min-h-screen flex-col items-center justify-start p-24">
			<p className="text-2xl">You are not signed in</p>
		</main>
	);
}
