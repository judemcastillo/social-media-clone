"use server";

import { auth } from "@/auth";
import { SignOutButton } from "@/components/buttons/SignOutButton";
import Image from "next/image";

export default async function Home() {
	const session = await auth();
	if (session?.user) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-start p-24">
				<p className="text-2xl">
					You are signed in as {session.user.name || session.user.email}
				</p>
				{session?.user?.image ? (
					<Image
						src={session.user.image}
						alt="Profile Picture"
						width={100}
						height={100}
					/>
				) : (
					<div className="w-[100px] h-[100px] rounded-full bg-zinc-800" />
				)}
				<SignOutButton />
			</main>
		);
	}
	return (
		<main className="flex min-h-screen flex-col items-center justify-start p-24">
			<p className="text-2xl">You are not signed in</p>
		</main>
	);
}
