"use client";

import { logout } from "@/lib/actions/auth-actions";
import { Button } from "../ui/button";

export const SignOutButton = () => {
	return (
		<Button
			onClick={() => {
				logout();
			}}
		>
			Sign Out
		</Button>
	);
};
