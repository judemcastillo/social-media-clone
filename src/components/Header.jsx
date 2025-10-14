"use server";

import { auth } from "@/auth";
import { ModeToggle } from "./ModeToggle";
import { Card } from "./ui/card";
import MenuDropDown from "./MenuDropDown";
import HeaderNav from "./HeaderNav";
import HeaderSearch from "./HeaderSearch";
import { getUnreadTotal } from "@/lib/actions/conversation-actions";
import { Mail } from "lucide-react";
import Link from "next/link";

export default async function Header() {
	const session = await auth();
	const unread = session?.user ? await getUnreadTotal() : 0;

	return (
		<Card className="grid grid-cols-3 h-[7vh]  rounded-none w-full p-0">
			<div className="flex flex-row items-center gap-2 px-5">
				<Link href="/" className="cursor-pointer">
					<img src="/Logo.svg" alt="Logo" className="h-8" />
				</Link>
				<HeaderSearch />
			</div>

			{/* active-aware nav */}
			<div className="text-muted-foreground flex flex-row items-center justify-center">
				<HeaderNav />
			</div>

			<div className="flex flex-row items-center gap-4 justify-end px-6">
				{/* <Link href="/messages" className="relative">
					<Mail className="size-5" />
					{unread > 0 && (
						<span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
							{unread > 99 ? "99+" : unread}
						</span>
					)}
				</Link> */}
				<ModeToggle />
				{session?.user && <MenuDropDown />}
			</div>
		</Card>
	);
}
