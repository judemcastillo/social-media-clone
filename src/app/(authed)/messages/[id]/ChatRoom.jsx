"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useSocket } from "@/components/chat/useSocket";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/Avatar";
import { fetchMessagesPage } from "@/lib/actions/conversation-actions";
import { uploadToSupabase } from "@/lib/supabase-upload"; // reuse your existing helper

export default function ChatRoom({
	conversationId,
	initialMessages = [],
	initialCursor = null,
}) {
	const socket = useSocket();
	const [items, setItems] = useState(initialMessages);
	const [cursor, setCursor] = useState(initialCursor);
	const [text, setText] = useState("");
	const [sending, setSending] = useState(false);
	const [loadingMore, startMore] = useTransition();
	const bottomRef = useRef(null);

	// join socket room
	useEffect(() => {
		if (!socket) return;
		socket.emit("conversation:join", { conversationId });
		const onNew = ({ message }) => setItems((prev) => [...prev, message]);
		socket.on("message:new", onNew);
		return () => {
			socket.off("message:new", onNew);
		};
	}, [socket, conversationId]);

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
		const url = await uploadToSupabase(file, { folder: "chat" }); // returns public URL
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
			const res = await fetchMessagesPage({
				conversationId,
				cursor,
				limit: 30,
			});
			setItems((prev) => [...res.messages, ...prev]);
			setCursor(res.nextCursor);
		});
	};

	return (
		<main className="mx-auto max-w-[700px] py-4 w-full">
			<Card className="p-3 h-[75vh] flex flex-col">
				<div className="flex-1 overflow-y-auto space-y-3 pr-1">
					{cursor && (
						<button
							onClick={loadMore}
							disabled={loadingMore}
							className="mx-auto text-xs underline opacity-70"
						>
							{loadingMore ? "Loading…" : "Load older"}
						</button>
					)}
					{items.map((m) => (
						<div key={m.id} className="flex gap-2 items-start">
							<Avatar src={m.author?.image} size={28} />
							<div>
								<div className="text-xs opacity-70">
									{m.author?.name} ·{" "}
									{new Date(m.createdAt).toLocaleTimeString()}
								</div>
								{m.content && (
									<div className="text-sm whitespace-pre-wrap">{m.content}</div>
								)}
								{m.attachments?.map((a) => (
									<img
										key={a.id}
										src={a.url}
										alt=""
										className="mt-1 max-h-64 rounded"
									/>
								))}
							</div>
						</div>
					))}
					<div ref={bottomRef} />
				</div>

				<div className="border-t pt-2 flex items-center gap-2">
					<input
						type="file"
						accept="image/*"
						onChange={onPickFile}
						className="text-xs"
					/>
					<textarea
						className="flex-1 text-sm bg-transparent outline-none resize-none h-10"
						placeholder="Type a message…"
						value={text}
						onChange={(e) => setText(e.target.value)}
						onKeyDown={onEnter}
						disabled={sending}
					/>
					<button
						onClick={() => text.trim() && sendMessage({ content: text.trim() })}
						disabled={sending || !text.trim()}
						className="px-3 py-1 text-sm rounded border"
					>
						Send
					</button>
				</div>
			</Card>
		</main>
	);
}
