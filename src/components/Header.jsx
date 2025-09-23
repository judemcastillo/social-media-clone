"use server";

import { auth } from "@/auth";
import { SignOutButton } from "./buttons/SignOutButton";
import { Compass, Home, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";

export default async function Header() {
	const session = await auth();
	return (
		<div className="flex flex-row justify-between p-5 items-center font-[50px] h-[7vh]">
			<div>Logo</div>
			<div className="flex flex-row gap-5 text-slate-600">
				<Link href="/home" className="px-4">
					<Home />
				</Link>
				<button className="px-4">
					<Mail />
				</button>
				<button className="px-4">
					<Compass />
				</button>
			</div>
			<div>Profile {session?.user && <SignOutButton />}</div>
		</div>
	);
}
