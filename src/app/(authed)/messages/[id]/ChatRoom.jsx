"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useSocket } from "@/components/chat/useSocket";
import { Card, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/Avatar";
import {
	fetchMessagesPage,
	markConversationRead,
} from "@/lib/actions/conversation-actions";
import { uploadToSupabase } from "@/lib/supabase-upload";
import { Button } from "@/components/ui/button";
import { CirclePlus, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/components/providers/user-context";

function relativeTime(ts) {
	const t =
		typeof ts === "string"
			? new Date(ts).getTime()
			: ts?.getTime?.() ?? Date.now();
	const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
	if (s < 60) return "just now";
	const m = Math.floor(s / 60);
	if (m < 60) return `${m}m`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h`;
	const d = Math.floor(h / 24);
	return `${d}d`;
}

export default function ChatRoom({
	conversationId,
	kind = "dm",
	requestId = null,
	initialMessages = [],
	initialCursor = null,
	peers,
	title,
}) {
	const viewer = useUser();
	const socket = useSocket();

	const [items, setItems] = useState(initialMessages);
	const [cursor, setCursor] = useState(initialCursor);
	const [text, setText] = useState("");
	const [sending, setSending] = useState(false);
	const [loadingMore, startMore] = useTransition();
	const bottomRef = useRef(null);

	// Track joined room + seen message ids to prevent duplicates
	const joinedRef = useRef(null);
	const seenIdsRef = useRef(
		new Set(initialMessages.map((m) => m.id).filter(Boolean))
	);

	// Helper: append only if not seen
	const appendUnique = (message) => {
		const id = message?.id;
		if (id && seenIdsRef.current.has(id)) return;
		if (id) seenIdsRef.current.add(id);
		setItems((prev) => [...prev, message]);
	};

	useEffect(() => {
		if (!conversationId || !items.length) return;
		markConversationRead({ conversationId });
	}, [conversationId, items.length]);

	// Join socket room once per conversation + attach a single listener
	useEffect(() => {
		if (!socket || !conversationId) return;

		if (joinedRef.current !== conversationId) {
			socket.emit("conversation:join", { conversationId });
			joinedRef.current = conversationId;
		}

		const onNew = ({ message }) => {
			// Guard: ignore messages that don't belong to this conversation
			if (!message || message.conversationId !== conversationId) return;
			appendUnique(message);
		};

		// Clear any stale handlers for this event on this socket, then attach
		socket.off("message:new", onNew);
		socket.on("message:new", onNew);

		return () => {
			socket.off("message:new", onNew);
		};
	}, [socket, conversationId]); // keep deps minimal so we don't rebind unnecessarily

	// Auto-scroll to bottom on new messages
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [items.length]);

	async function sendMessage({ content, attachments = [] }) {
		if (!socket) return;
		setSending(true);
		try {
			socket.emit("message:send", { conversationId, content, attachments });
			setText("");
		} finally {
			setSending(false);
		}
	}

	async function onPickFile(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		const url = await uploadToSupabase(file, { folder: "chat" });
		await sendMessage({ content: "", attachments: [{ url, type: "image" }] });
		e.target.value = "";
	}

	function onEnter(e) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (text.trim()) sendMessage({ content: text.trim() });
		}
	}

	const loadMore = () => {
		if (!cursor) return;
		startMore(async () => {
			const idForFetch =
				kind === "dm"
					? requestId || peers?.find((p) => p?.id)?.id || peers?.[0]?.id
					: conversationId;
			if (!idForFetch) return;
			try {
				const res = await fetchMessagesPage({
					id: idForFetch,
					kind,
					cursor,
					limit: 30,
				});
				if (!res?.ok) return;
				setItems((prev) => {
					const uniques = (res.messages || []).filter((m) => {
						if (!m?.id) return true;
						if (seenIdsRef.current.has(m.id)) return false;
						seenIdsRef.current.add(m.id);
						return true;
					});
					return [...uniques, ...prev];
				});
				setCursor(res.nextCursor);
			} catch (err) {
				console.error("Load older messages failed", err);
			}
		});
	};

	return (
		<main className="p-6 px-5 h-[93vh] w-full overflow-y-auto">
			<Card className="p-4 h-full flex flex-col">
				<CardTitle className="h-12 flex flex-row items-center border-b-1 dark:border-gray-500 pb-3">
					<span className="flex flex-row gap-2 items-center">
						{peers && <Avatar src={peers[0]?.image} size={30} />}
						{title || "Conversation"}
					</span>
				</CardTitle>

				<div className="flex-1 overflow-y-auto space-y-3">
					{cursor && (
						<div className="flex flex-row items-center">
							<button
								onClick={loadMore}
								disabled={loadingMore}
								className="mx-auto text-xs underline opacity-70"
							>
								{loadingMore ? "Loading…" : "Load older"}
							</button>
						</div>
					)}

					<ScrollArea className="bg-card rounded-xl space-y-3 pr-3 flex flex-col">
						{items.map((m) => {
							const mine = m.author?.id === viewer?.id;
							const displayName = mine
								? "You"
								: m.author?.name || m.author?.email || "User";

							return (
								<div
									key={m.id}
									className={`flex gap-2 items-end ${
										mine ? "justify-end" : ""
									}`}
								>
									{!mine && (
										<div className="pb-5">
											<Avatar src={m.author?.image} size={28} />
										</div>
									)}

									<div
										className={`space-y-1 max-w-[80%] ${
											mine ? "items-end text-right flex flex-col" : ""
										}`}
									>
										<div className="text-xs opacity-70 px-3">{displayName}</div>

										<div
											className={`rounded-xl px-4 py-1 w-fit ${
												mine
													? "bg-primary text-primary-foreground ml-auto"
													: "bg-muted"
											}`}
										>
											{m.content && (
												<div className="text-sm whitespace-pre-wrap">
													{m.content}
												</div>
											)}
											{m.attachments?.map((a) => (
												<img
													key={a.id ?? a.url}
													src={a.url}
													alt=""
													className={`py-3 max-h-64 rounded  p-1 ${
														mine ? "ml-auto" : ""
													}`}
												/>
											))}
										</div>
										<div className="text-xs opacity-70 px-3">
											{relativeTime(m.createdAt)}
										</div>
									</div>

									{mine && (
										<div className="pb-5">
											<Avatar src={viewer?.image} size={28} />
										</div>
									)}
								</div>
							);
						})}
					</ScrollArea>

					<div ref={bottomRef} />
				</div>

				<div className="border-t pt-2 flex items-center gap-2 px-1 dark:border-gray-500">
					<label className="cursor-pointer">
						<CirclePlus className="text-secondary" />
						<input
							type="file"
							accept="image/*"
							onChange={onPickFile}
							className="hidden"
						/>
					</label>

					<textarea
						className="flex-1 text-sm bg-accent outline-none resize-none p-2 rounded-2xl h-10"
						placeholder="Type a message…"
						rows={2}
						value={text}
						onChange={(e) => setText(e.target.value)}
						onKeyDown={onEnter}
						disabled={sending}
					/>

					<Button
						onClick={() => text.trim() && sendMessage({ content: text.trim() })}
						disabled={sending || !text.trim()}
						className="cursor-pointer rounded-full p-0"
						variant="default"
					>
						<Send className="size-3.5" />
					</Button>
				</div>
			</Card>
		</main>
	);
}
