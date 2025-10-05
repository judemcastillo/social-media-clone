// src/components/messages/ConversationsClient.jsx
"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/Avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSocket } from "@/components/chat/useSocket";
import { useUser } from "@/components/providers/user-context";
import { usePathname } from "next/navigation";

const TABS = ["All", "Unread", "Groups", "Rooms"];

export default function ConversationsClient({ initialItems = [] }) {
	const viewer = useUser();
	const viewerId = viewer?.id ?? null;
	const socket = useSocket();
	const pathname = usePathname();

	const { routeId, routeKind } = useMemo(() => {
		if (!pathname) return { routeId: "", routeKind: "dm" };
		const parts = pathname.split("/").filter(Boolean);
		if (parts[0] !== "messages") return { routeId: "", routeKind: "dm" };
		const last = parts[parts.length - 1];
		if (last === "group")
			return { routeId: parts[1] || "", routeKind: "group" };
		if (last === "room") return { routeId: parts[1] || "", routeKind: "room" };
		return { routeId: parts[1] || "", routeKind: "dm" };
	}, [pathname]);

	const [items, setItems] = useState(initialItems);
	useEffect(() => setItems(initialItems), [initialItems]);

	const [q, setQ] = useState("");
	const [tab, setTab] = useState("All");

	// --- NEW: track which rooms we've joined so we don't spam the server ---
	const joinedRef = useRef(new Set());

	// Join all conversation rooms we know about; re-join on socket reconnect

	useEffect(() => {
		if (!socket) return;

		const joined = joinedRef.current;
		const joinOnce = (id) => {
			if (!id || joined.has(id)) return;
			socket.emit("conversation:join", { conversationId: id });
			joined.add(id);
			console.log("joined room", id);
		};

		items.forEach((c) => joinOnce(c.id));

		const onConnect = () => {
			joined.clear();
			items.forEach((c) => joinOnce(c.id));
		};
		socket.on("connect", onConnect);
		return () => socket.off("connect", onConnect);
	}, [socket, items]);

	// live updates
	useEffect(() => {
		if (!socket) return;

		const onNewConversation = ({ conversation }) => {
			if (!conversation?.id) return;
			setItems((prev) => {
				if (prev.some((c) => c.id === conversation.id)) return prev;
				return [conversation, ...prev];
			});

			// NEW: immediately join the newly created conversation room
			if (conversation?.id) {
				const joined = joinedRef.current;
				if (!joined.has(conversation.id)) {
					socket.emit("conversation:join", { conversationId: conversation.id });
					joined.add(conversation.id);
				}
			}
		};

		const onNewMessage = ({ message }) => {
			if (!message?.conversationId) return;

			setItems((prev) => {
				const idx = prev.findIndex((c) => c.id === message.conversationId);
				if (idx === -1) return prev;

				const conv = prev[idx];
				const peers = (conv.participants || [])
					.map((p) => p.user)
					.filter(Boolean);
				const peerForDM =
					peers.find((u) => u?.id && u.id !== viewerId) || peers[0] || null;

				const fromOther = message.author?.id && message.author.id !== viewerId;
				const isActive =
					conv.isPublic || conv.isGroup
						? routeId === conv.id
						: routeKind === "dm" && peerForDM?.id && routeId === peerForDM.id;

				const unreadCount = Math.max(
					0,
					(conv.unreadCount || 0) + (fromOther && !isActive ? 1 : 0)
				);

				const updated = {
					...conv,
					unreadCount,
					messages: [message, ...(conv.messages ?? [])],
				};

				return [updated, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
			});
		};

		socket.on("conversation:new", onNewConversation);
		socket.on("message:new", onNewMessage);
		return () => {
			socket.off("conversation:new", onNewConversation);
			socket.off("message:new", onNewMessage);
		};
	}, [socket, viewerId, routeId, routeKind]);

	// zero local unread when viewing that conversation
	useEffect(() => {
		if (!routeId) return;
		setItems((prev) =>
			prev.map((c) => {
				if (c.isPublic || c.isGroup) {
					return c.id === routeId ? { ...c, unreadCount: 0 } : c;
				}
				const peers = (c.participants || []).map((p) => p.user).filter(Boolean);
				const peerForDM =
					peers.find((u) => u?.id && u.id !== viewerId) || peers[0] || null;
				return peerForDM?.id && peerForDM.id === routeId
					? { ...c, unreadCount: 0 }
					: c;
			})
		);
	}, [routeId, routeKind, viewerId]);

	// helper for DM title
	function getPeerAndTitle(c) {
		const peers = (c.participants || []).map((p) => p.user).filter(Boolean);
		const peerForDM =
			peers.find((u) => u?.id && u.id !== viewerId) || peers[0] || null;

		const title =
			c.isGroup || c.isPublic
				? c.title ||
				  (peers.length
						? peers.map((u) => u?.name || "User").join(", ")
						: "Conversation")
				: peerForDM?.name || "User";

		return { peers, peerForDM, title };
	}

	const filtered = useMemo(() => {
		const needle = q.trim().toLowerCase();

		const bySearch = (c) => {
			if (!needle) return true;
			const { peers, title } = getPeerAndTitle(c);
			const hay = [
				title.toLowerCase(),
				...peers.map((u) => (u?.name || "").toLowerCase()),
			].join(" ");
			return hay.includes(needle);
		};

		const byTab = (c) => {
			if (tab === "All") return true;
			if (tab === "Unread") return (c.unreadCount || 0) > 0;
			if (tab === "Groups") return !!c.isGroup && !c.isPublic;
			if (tab === "Rooms") return !!c.isPublic;
			return true;
		};

		return items.filter((c) => bySearch(c) && byTab(c));
	}, [items, q, tab]);

	return (
		<main className="max-w-[700px] w-full h-[93vh]">
			<Card className="rounded-none h-full">
				<h1 className="text-xl font-semibold m-2">Messages</h1>

				<div className="px-2 pb-2">
					<input
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Search conversations…"
						className="w-full px-3 py-2 text-sm bg-accent rounded-md outline-none"
					/>
				</div>

				<div className="px-2 border-b dark:border-gray-500">
					<div className="flex gap-3">
						{["All", "Unread", "Groups", "Rooms"].map((t) => (
							<button
								key={t}
								onClick={() => setTab(t)}
								className={`border-b-2 px-2 py-1 text-xs cursor-pointer ${
									tab === t
										? "border-primary text-primary font-medium"
										: "border-transparent text-gray-500 hover:text-foreground-muted hover:border-gray-300"
								}`}
							>
								{t}
							</button>
						))}
					</div>
				</div>

				<ScrollArea>
					{filtered.map((c) => {
						const { peerForDM, title } = getPeerAndTitle(c);
						const last = c.messages?.[0];

						let href = "";
						if (c.isPublic) href = `/messages/${c.id}/room`;
						else if (c.isGroup) href = `/messages/${c.id}/group`;
						else href = `/messages/${peerForDM?.id || c.id}`;

						const isActive =
							c.isPublic || c.isGroup
								? routeId === c.id
								: peerForDM?.id && routeId === peerForDM.id;

						return (
							<Card
								key={c.id}
								className={`p-3 flex justify-between rounded-none border-muted ${
									isActive ? "bg-primary/10" : ""
								}`}
							>
								<div className="flex items-center gap-3">
									<Avatar src={peerForDM?.image} size={36} />
									<div className="text-sm">
										<Link href={href}>
											<div className="font-medium hover:underline">{title}</div>
										</Link>
										{last ? (
											<div className="text-xs opacity-70 overflow-ellipsis truncate">
												{last.author?.id === viewerId
													? "You: "
													: `${last.author?.name ?? ""} `}
												{last.attachments?.length
													? "[attachment]"
													: last.content}
											</div>
										) : (
											<div className="text-xs opacity-70">No messages yet</div>
										)}
									</div>
								</div>

								{(c.unreadCount || 0) > 0 && (
									<div className="flex items-center">
										<span className="min-w-[20px] h-[20px] px-1 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center">
											{c.unreadCount > 99 ? "99+" : c.unreadCount}
										</span>
									</div>
								)}
							</Card>
						);
					})}
				</ScrollArea>
			</Card>
		</main>
	);
}
