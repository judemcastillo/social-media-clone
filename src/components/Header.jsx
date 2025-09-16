"use server";

import { auth } from "@/auth";
import { SignOutButton } from "./buttons/SignOutButton";

export default async function Header() {
	const session = await auth();
	return (
		<div className="flex flex-row justify-between p-5 items-center font-[50px] h-[7vh]">
			<div>Logo</div>
			<div>Nav</div>
			<div>Profile {session?.user && <SignOutButton />}</div>
		</div>
	);
}
