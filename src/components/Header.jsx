"use server";

import { auth } from "@/auth";
import { ModeToggle } from "./ModeToggle";
import { Card } from "./ui/card";
import MenuDropDown from "./MenuDropDown";
import HeaderNav from "./HeaderNav";
import HeaderSearch from "./HeaderSearch";

export default async function Header() {
	const session = await auth();

	return (
		<Card className="grid grid-cols-3 h-[7vh]  rounded-none w-full p-0">
			<div className="flex flex-row items-center gap-2 px-5">
				<div className="font-semibold">Logo</div>
				<HeaderSearch />
			</div>

			{/* active-aware nav */}
			<div className="text-muted-foreground flex flex-row items-center justify-center">
				<HeaderNav />
			</div>

			<div className="flex flex-row items-center gap-4 justify-end px-6">
				<ModeToggle />
				{session?.user && <MenuDropDown />}
			</div>
		</Card>
	);
}
