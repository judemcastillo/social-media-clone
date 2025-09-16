"use server";

import { auth } from "@/auth";
import { SignOutButton } from "@/components/buttons/SignOutButton";
import Image from "next/image";
import { Card } from "../ui/card";

export default async function LeftSideBar() {
	const session = await auth();
	if (session?.user) {
		return (
			<Card className=" m-6 p-4 shadow-2xl flex flex-col justify-center items-center">
				{session?.user?.image ? (
					<Image
						src={session.user.image}
						alt="Profile Picture"
						width={50}
						height={50}
					/>
				) : (
					<div className="w-[100px] h-[100px] rounded-full bg-blue-300" />
				)}

				<p className="text-2xl">{session.user.name || session.user.email}</p>

				<SignOutButton />
			</Card>
		);
	}
	return (
		<main className="flex min-h-screen flex-col items-center justify-start p-24">
			<p className="text-2xl">You are not signed in</p>
		</main>
	);
}
