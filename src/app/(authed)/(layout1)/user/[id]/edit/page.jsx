import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import EditProfileForm from "@/components/profile/EditProfileForm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditProfilePage({ params:p }) {
	const params = await p; // workaround for next.js bug
	const session = await auth();
	const me = session?.user?.id;
	const role = session?.user?.role;

	if (!me) redirect("/login");
	if (me !== params.id && role !== "ADMIN") redirect(`/user/${params.id}`);
	if (role === "GUEST") redirect(`/user/${params.id}`); // guests can’t edit

	const user = await prisma.user.findUnique({
		where: { id: me },
		select: {
			id: true,
			name: true,
			bio: true,
			skills: true,
			image: true,
			coverImageUrl: true,
		},
	});

	return (
		<main className="mx-auto max-w-[700px] space-y-4 py-6 max-h-[93vh] overflow-y-auto scrollbar-none">
			<h1 className="text-xl font-semibold">Edit profile</h1>
			<EditProfileForm user={user} />
		</main>
	);
}
