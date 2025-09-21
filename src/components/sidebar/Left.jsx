"use server";

import { auth } from "@/auth";
import { SignOutButton } from "@/components/buttons/SignOutButton";
import Image from "next/image";
import { Card } from "../ui/card";
import { Avatar } from "../Avatar";

export default async function LeftSideBar() {
	const session = await auth();
	if (session?.user) {
		return (
			<Card className=" m-6 p-4 shadow-lg flex flex-col justify-center items-center">
				<Avatar src={session.user.image} alt={session.user.name}  size={80}/>

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
