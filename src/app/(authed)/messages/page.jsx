// src/app/messages/page.jsx
import { auth } from "@/auth";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import UnreadSummary from "@/components/messages/UnreadSummary";
import { fetchUsersAction } from "@/lib/actions/discover-actions";
import { fetchFeaturedRooms } from "@/lib/actions/conversation-actions";
import ProfileCard from "@/components/profile/ProfileCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import JoinRoomButton from "@/components/messages/JoinRoomButton";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
	const session = await auth();
	const viewerId = session?.user?.id ?? null;
	const viewerRole = session?.user?.role ?? "USER";

	let discoverUsers = [];
	if (viewerId) {
		const discoverResponse = await fetchUsersAction();
		discoverUsers = (discoverResponse?.users || []).filter(
			(u) => u.role !== "GUEST"
		);
	}
	const { rooms: chatRooms = [] } = await fetchFeaturedRooms();

	return (
		<div className="flex flex-col gap-6 p-6 m-4 h-[87vh] overflow-y-auto scrollbar-none">
			<Card className="flex flex-col items-center justify-center text-center gap-2">
				<CardHeader className="items-center gap-2 text-center w-full">
					<CardTitle>
						<UnreadSummary />
					</CardTitle>
					<CardDescription>
						Select a conversation from the list to continue chatting.
					</CardDescription>
				</CardHeader>
			</Card>

			<section className="flex flex-col gap-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold">Chat Rooms</h2>
				</div>
				<Card>
					<CardContent className="pt-6">
						<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
							{chatRooms.length ? (
								chatRooms.map((room) => {
									const isMember = room.viewerStatus === "JOINED";
									return (
										<div
											key={room.id}
											className="h-full rounded-xl border border-border bg-card p-4 flex flex-col justify-between gap-4"
										>
											<div>
												<p className="text-base font-semibold">{room.title}</p>
												<p className="text-sm text-muted-foreground">
													{room.memberCount} members · {room.messageCount} messages
												</p>
											</div>
											<div className="flex gap-2">
												<Link href={`/messages/${room.id}/room`} className="flex-1">
													<Button
														variant="secondary"
														className="w-full text-xs cursor-pointer"
													>
														Enter
													</Button>
												</Link>
												{isMember ? (
													<Button
														variant="outline"
														disabled
														className="w-[90px] text-xs cursor-default"
													>
														Joined
													</Button>
												) : (
													<JoinRoomButton
														conversationId={room.id}
														className="w-[90px]"
													/>
												)}
											</div>
										</div>
									);
								})
							) : (
								<p className="col-span-full text-center text-sm text-muted-foreground">
									No chat rooms available.
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			</section>

			<section className="flex flex-col gap-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold">Discover Yappers</h2>
					<Link
						href="/discover"
						className="text-sm text-primary hover:underline cursor-pointer"
					>
						View all
					</Link>
				</div>
				<Card>
					<CardContent className="pt-6 max-w-[700px]">
						<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
							{discoverUsers.length ? (
								discoverUsers.map((u) => {
									const canFollow =
										viewerId && viewerRole !== "GUEST" && u.role !== "GUEST";
									return (
										<ProfileCard
											key={u.id}
											u={u}
											canFollow={canFollow}
											viewerId={viewerId}
										/>
									);
								})
							) : (
								<p className="col-span-full text-center text-sm text-muted-foreground">
									No yappers to suggest right now.
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
