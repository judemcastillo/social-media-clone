import { auth } from "@/auth";
import RegisterForm from "@/components/auth/RegisterForm";

export default async function Register() {
	const session = await auth();
	if (session?.user) {
		return <div>Already signed in</div>;
	}
	return (
		<main className="flex min-h-screen flex-row items-center  justify-center bg-accent-foreground max-w-screen w-full">
			<div className="w-full m-auto flex-2 hidden lg:flex items-center justify-center h-full">
				<img src="/Banner.png" alt="Logo" className="h-screen object-contain" />
			</div>
			<RegisterForm />
			
		</main>
	);
}
