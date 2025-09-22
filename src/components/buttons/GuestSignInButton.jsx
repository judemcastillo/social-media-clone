import { signInAsGuestAction } from "@/lib/actions/auth-actions";
import { useActionState } from "react";
import { Button } from "../ui/button";

export default function GuestSignInButton() {
	const [state, action, pending] = useActionState(signInAsGuestAction, null);

	return (
		<form action={action} className="w-full">
			<Button
				type="submit"
				disabled={pending}
				className="bg-green-500 hover:bg-green-600 text-white w-full"
			>
				{pending ? "Signing in..." : "Sign in as Guest"}
			</Button>
		</form>
	);
}
