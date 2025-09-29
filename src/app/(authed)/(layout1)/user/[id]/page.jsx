import { Suspense } from "react";
import ProfilePageServer from "./ProfilePage.server";

import ProfilePageSkeleton from "@/components/skeletons/ProfilePageSkeleton";

export const dynamic = "force-dynamic";

export default async function UserProfilePage({ params: p }) {
	const params = await p;
	return (
		<Suspense fallback={<ProfilePageSkeleton />}>
			<ProfilePageServer userId={params.id} />
		</Suspense>
	);
}
