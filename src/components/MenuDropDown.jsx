"use client";
import Link from "next/link";
import { Avatar } from "./Avatar";
import {
	DropdownMenu,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { logout } from "@/lib/actions/auth-actions";

export default function MenuDropDown({ session }) {
	return (
		<DropdownMenu className="focus:outline-none focus:ring-0 focus:border-transparent">
			<DropdownMenuTrigger className="focus:outline-none focus:ring-0 focus:border-transparent cursor-pointer">
				<Avatar src={session.user.image} size={45} />
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem>
					<Link href={`/user/${session.user.id}`}>Profile</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => logout()}>Sign Out</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
