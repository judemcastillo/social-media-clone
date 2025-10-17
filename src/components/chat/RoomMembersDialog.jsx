"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/Avatar";

export default function RoomMembersDialog({
	open,
	onOpenChange,
	members = [],
	title = "Members",
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<ScrollArea className="max-h-72 pr-4">
					<ul className="space-y-3">
						{members.length ? (
							members.map((member) => {
								const joinedAt = member?.joinedAt
									? new Date(member.joinedAt)
									: null;
								const joinedLabel = joinedAt
									? `Joined ${joinedAt.toLocaleDateString()}`
									: "Member";

								return (
									<li key={member?.user?.id} className="flex items-center gap-3">
										<Avatar
											src={member?.user?.image}
											size={34}
											userId={member?.user?.id}
										/>
										<div>
											<p className="text-sm font-medium">
												{member?.user?.name || member?.user?.email || "User"}
											</p>
											<p className="text-xs text-muted-foreground">{joinedLabel}</p>
										</div>
									</li>
								);
							})
						) : (
							<li className="text-sm text-muted-foreground text-center py-4">
								No members yet.
							</li>
						)}
					</ul>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
