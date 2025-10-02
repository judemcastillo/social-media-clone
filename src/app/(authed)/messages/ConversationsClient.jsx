"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/Avatar";

export default function ConversationsClient({ initialItems }) {
	const items = initialItems || [];
	return (
		<main className="mx-auto max-w-[700px] py-4 w-full">
			<h1 className="text-xl font-semibold mb-4">Messages</h1>
			<div className="space-y-2">
				{items.map((c) => {
					const peers = (c.participants || []).map((p) => p.user);
					const title =
						c.title ||
						(peers.length
							? peers.map((u) => u.name || "User").join(", ")
							: "Conversation");
					const last = c.messages?.[0];
					return (
						<Card key={c.id} className="p-3 flex items-center justify-between">
							<div className="flex items-center gap-3">
							
								<Avatar src={peers[0]?.image} size={36} />
								<div className="text-sm">
									<div className="font-medium">{title}</div>
									{last ? (
										<div className="text-xs opacity-70">
											{last.author?.name ? `${last.author.name}: ` : ""}
											{last.attachments?.length ? "[attachment]" : last.content}
										</div>
									) : (
										<div className="text-xs opacity-70">No messages yet</div>
									)}
								</div>
							</div>
							<Link href={`/messages/${peers[0].id}`} className="text-xs underline">
								Open
							</Link>
						</Card>
					);
				})}
			</div>
		</main>
	);
}
