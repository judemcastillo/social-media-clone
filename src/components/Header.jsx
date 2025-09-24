"use server";

import { auth } from "@/auth";
import { ModeToggle } from "./ModeToggle";
import { Card } from "./ui/card";
import MenuDropDown from "./MenuDropDown";
import HeaderNav from "./HeaderNav";

export default async function Header() {
	const session = await auth();

	return (
		<Card className="flex flex-row justify-between items-center h-[7vh] w-[100vw] rounded-none p-5">
			<div className="font-semibold">Logo</div>

			{/* active-aware nav */}
			<div className="text-muted-foreground">
				<HeaderNav />
			</div>

			<div className="flex flex-row items-center gap-4">
				<ModeToggle />
				{session?.user && <MenuDropDown session={session} />}
			</div>
		</Card>
	);
}
