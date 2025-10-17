"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useOnlineUsers, useSocket } from "@/components/chat/useSocket";
import { Card, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/Avatar";
import {
	fetchMessagesPage,
	leaveGroup,
	leavePublicRoom,
	joinPublicRoom,
	markConversationRead,
} from "@/lib/actions/conversation-actions";
import { uploadToSupabase } from "@/lib/supabase-upload";
import { Button } from "@/components/ui/button";
import { CirclePlus, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/components/providers/user-context";
import { useRouter } from "next/navigation";
import GroupMembersDialog from "@/components/chat/GroupMembersDialog";
import RoomMembersDialog from "@/components/chat/RoomMembersDialog";
import { useUnread } from "@/components/providers/unread-context";

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
	peers = [],
	title,
	participants = [],
	viewerRole = null,
	viewerStatus = null,
}) {
	const viewer = useUser();
	const socket = useSocket();
	const router = useRouter();
	const { setActiveConversation, decrementUnread } = useUnread();

	const [items, setItems] = useState(initialMessages);
	const [cursor, setCursor] = useState(initialCursor);
	const [text, setText] = useState("");
	const [sending, setSending] = useState(false);
	const [loadingMore, startMore] = useTransition();
	const [groupLeaving, startGroupLeaving] = useTransition();
	const [joiningRoom, startJoiningRoom] = useTransition();
	const [leavingRoom, startLeavingRoom] = useTransition();
	const [membersOpen, setMembersOpen] = useState(false);
const [memberEntries, setMemberEntries] = useState(participants || []);
const [displayPeers, setDisplayPeers] = useState(peers || []);
const [role, setRole] = useState(viewerRole);
const [status, setStatus] = useState(viewerStatus);
const [roomActionError, setRoomActionError] = useState("");
const bottomRef = useRef(null);
const latestMessageIdRef = useRef(null);

const isRoom = kind === "room";
const viewerIsRoomMember = !isRoom || status === "JOINED";
const viewerCanSend = viewerIsRoomMember;

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
		if (!conversationId) return;
		setActiveConversation(conversationId);
		return () => setActiveConversation(null);
	}, [conversationId, setActiveConversation]);

	useEffect(() => {
		if (!conversationId || !items.length) return;
		let isMounted = true;
		(async () => {
			try {
				const res = await markConversationRead({ conversationId });
				if (!isMounted) return;
				if (res?.ok && res.count) {
					decrementUnread(res.count);
				}
			} catch (err) {
				console.error("markConversationRead failed", err);
			}
		})();
		return () => {
			isMounted = false;
		};
	}, [conversationId, items.length, decrementUnread]);

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

	// Auto-scroll to bottom only when new messages arrive, not when prepending older ones
	useEffect(() => {
		const latestId =
			items.length > 0 ? items[items.length - 1]?.id ?? null : null;
		const prevLatestId = latestMessageIdRef.current;
		const shouldScroll =
			(latestId && latestId !== prevLatestId) || (!prevLatestId && latestId);

		if (shouldScroll) {
			bottomRef.current?.scrollIntoView({
				behavior: prevLatestId ? "smooth" : "auto",
			});
		}

		latestMessageIdRef.current = latestId;
	}, [items]);

	async function sendMessage({ content, attachments = [] }) {
		if (!socket || !viewerCanSend) return;
		setSending(true);
		try {
			socket.emit("message:send", { conversationId, content, attachments });
			setText("");
		} finally {
			setSending(false);
		}
	}

	async function onPickFile(e) {
		if (!viewerCanSend) return;
		const file = e.target.files?.[0];
		if (!file) return;
		const url = await uploadToSupabase(file, { folder: "chat" });
		await sendMessage({ content: "", attachments: [{ url, type: "image" }] });
		e.target.value = "";
	}

	function onEnter(e) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (!viewerCanSend) return;
			if (text.trim()) sendMessage({ content: text.trim() });
		}
	}
	useEffect(() => {
		setMemberEntries(participants || []);
	}, [participants]);

	useEffect(() => {
		if (kind === "group") {
			setDisplayPeers(
				(memberEntries || []).map((p) => p.user).filter(Boolean)
			);
		} else {
			setDisplayPeers(peers || []);
		}
	}, [memberEntries, peers, kind]);

	useEffect(() => {
		setRole(viewerRole);
		setStatus(viewerStatus);
	}, [viewerRole, viewerStatus]);

	const onlineUsers = useOnlineUsers();
	const firstPeerId = displayPeers?.[0]?.id;
	const isOnline = firstPeerId
		? onlineUsers.some((u) => (u?.userId ?? u?.id ?? "") === firstPeerId)
		: false;

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
						// if (!m?.id) return true;
						// if (seenIdsRef.current.has(m.id)) return false;
						seenIdsRef.current.add(m.id);
						return true;
					});
					return [...uniques, ...prev];
				});
				setCursor(res.nextCursor);
				if (Array.isArray(res.participants)) {
					setMemberEntries(res.participants);
				}
				if (typeof res.viewerRole !== "undefined") {
					setRole(res.viewerRole);
				}
				if (typeof res.viewerStatus !== "undefined") {
					setStatus(res.viewerStatus);
				}
			} catch (err) {
				console.error("Load older messages failed", err);
			}
		});
	};

	const handleMembersChange = useCallback(
		(nextMembers, nextRole = role, nextStatus = status) => {
			if (Array.isArray(nextMembers)) {
				setMemberEntries(nextMembers);
			}
			if (typeof nextRole !== "undefined") {
				setRole(nextRole);
			}
			if (typeof nextStatus !== "undefined") {
				setStatus(nextStatus);
			}
		},
		[role, status]
	);

	const handleJoinRoom = useCallback(() => {
		if (!conversationId) return;
		setRoomActionError("");
		startJoiningRoom(async () => {
			try {
				const res = await joinPublicRoom(conversationId);
				if (!res?.ok) {
					setRoomActionError(res?.error || "Unable to join room.");
					return;
				}
				setStatus("JOINED");
				setMemberEntries((prev) => {
					if (!viewer?.id) return prev;
					const exists = prev.some((m) => m?.user?.id === viewer.id);
					const entry = {
						user: {
							id: viewer.id,
							name: viewer.name || viewer.email || "You",
							email: viewer.email || null,
							image: viewer.image || null,
						},
						role: "MEMBER",
						status: "JOINED",
						joinedAt: new Date().toISOString(),
					};
					return exists
						? prev.map((m) =>
								m?.user?.id === viewer.id ? { ...m, status: "JOINED" } : m
						  )
						: [...prev, entry];
				});
				router.refresh();
			} catch (err) {
				console.error("joinPublicRoom failed", err);
				setRoomActionError("Unable to join room.");
			}
		});
	}, [conversationId, viewer, router, startJoiningRoom]);

	const handleLeaveRoom = useCallback(() => {
		if (!conversationId) return;
		if (typeof window !== "undefined") {
			const confirmed = window.confirm(
				"Leave this room? You can rejoin anytime from Messages."
			);
			if (!confirmed) return;
		}
		setRoomActionError("");
		startLeavingRoom(async () => {
			try {
				const res = await leavePublicRoom({ conversationId });
				if (!res?.ok) {
					setRoomActionError(res?.error || "Unable to leave room.");
					return;
				}
				setStatus("LEFT");
				setMemberEntries((prev) =>
					prev.filter((m) => m?.user?.id !== viewer?.id)
				);
				router.push("/messages");
				router.refresh();
			} catch (err) {
				console.error("leavePublicRoom failed", err);
				setRoomActionError("Unable to leave room.");
			}
		});
	}, [conversationId, viewer?.id, router, startLeavingRoom]);

	const handleLeaveGroup = useCallback(() => {
		if (!conversationId) return;
		if (typeof window !== "undefined") {
			const confirmed = window.confirm(
				"Leave this group? You will need to be re-added to join again."
			);
			if (!confirmed) return;
		}
		setRoomActionError("");
		startGroupLeaving(async () => {
			try {
				const res = await leaveGroup({ conversationId });
				if (!res?.ok) {
					setRoomActionError(res?.error || "Unable to leave group.");
					return;
				}
				router.push("/messages");
				router.refresh();
			} catch (err) {
				console.error("leaveGroup failed", err);
				setRoomActionError("Unable to leave group.");
			}
		});
	}, [conversationId, router, startGroupLeaving]);

	return (
		<main className="p-6 px-5 h-[93vh] w-full overflow-y-auto">
			<Card className="p-4 h-full flex flex-col">
				<CardTitle className="h-16 flex flex-row items-center border-b-1 dark:border-gray-500 pb-3 justify-between">
					<span className="flex flex-row gap-2 items-center">
						{displayPeers && (
							<Avatar
								src={displayPeers[0]?.image}
								size={40}
								userId={displayPeers[0]?.id}
							/>
						)}
						<div className="flex flex-col">
							{title || "Conversation"}
							{kind === "dm" && isOnline ? (
								<span className="text-xs text-green-500">Online</span>
							) : (
								<span className="text-xs text-gray-500">Offline</span>
							)}
						</div>
					</span>
		{kind === "group" ? (
			<span className="flex items-center gap-2">
				<Button
					variant="secondary"
					className="cursor-pointer text-xs px-3 py-2"
					onClick={() => setMembersOpen(true)}
				>
					Members
				</Button>
				<Button
					variant="ghost"
					className="cursor-pointer text-xs px-3 py-2 text-red-500 hover:text-red-600"
					onClick={handleLeaveGroup}
					disabled={groupLeaving}
				>
					Leave Group
				</Button>
			</span>
		) : isRoom ? (
			<span className="flex items-center gap-2">
				<Button
					variant="secondary"
					className="cursor-pointer text-xs px-3 py-2"
					onClick={() => setMembersOpen(true)}
				>
					Members
				</Button>
				{viewerIsRoomMember ? (
					<Button
						variant="ghost"
						className="cursor-pointer text-xs px-3 py-2 text-red-500 hover:text-red-600"
						onClick={handleLeaveRoom}
						disabled={leavingRoom}
					>
						Leave Room
					</Button>
				) : (
					<Button
						variant="default"
						className="cursor-pointer text-xs px-3 py-2"
						onClick={handleJoinRoom}
						disabled={joiningRoom}
					>
						{joiningRoom ? "Joining…" : "Join Room"}
					</Button>
				)}
			</span>
		) : null}
				</CardTitle>

		{roomActionError ? (
			<div className="py-2 text-xs text-red-500">{roomActionError}</div>
		) : null}
		{isRoom && !viewerIsRoomMember ? (
			<div className="py-2 text-xs text-muted-foreground">
				Join this room to start chatting.
			</div>
		) : null}

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
											<Avatar
												src={m.author?.image}
												size={30}
												userId={m.author?.id}
												dotSize={2}
											/>
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
											<Avatar
												src={viewer?.image}
												size={30}
												userId={viewer?.id}
												dotSize={2}
											/>
										</div>
									)}
								</div>
							);
						})}
					</ScrollArea>

					<div ref={bottomRef} />
				</div>

				<div className="border-t pt-2 flex items-center gap-2 px-1 dark:border-gray-500">
					<label
						className={`cursor-pointer ${viewerCanSend ? "" : "opacity-40 cursor-not-allowed"}`}
					>
						<CirclePlus className="text-secondary" />
						<input
							type="file"
							accept="image/*"
							onChange={onPickFile}
							className="hidden"
							disabled={!viewerCanSend || sending}
						/>
					</label>

					<textarea
						className="flex-1 text-sm bg-accent outline-none resize-none p-2 rounded-2xl h-10"
						placeholder={
							viewerCanSend
								? "Type a message…"
								: "Join this room to send messages"
						}
						rows={2}
						value={text}
						onChange={(e) => setText(e.target.value)}
						onKeyDown={onEnter}
						disabled={sending || !viewerCanSend}
					/>

					<Button
						onClick={() => text.trim() && sendMessage({ content: text.trim() })}
						disabled={sending || !viewerCanSend || !text.trim()}
						className="cursor-pointer rounded-full p-0"
						variant="default"
					>
						<Send className="size-3.5" />
					</Button>
				</div>
			</Card>

			{kind === "group" ? (
		<GroupMembersDialog
			open={membersOpen}
			onOpenChange={setMembersOpen}
			conversationId={conversationId}
			members={memberEntries}
			onMembersChange={handleMembersChange}
			viewerId={viewer?.id ?? null}
			viewerRole={role}
			viewerStatus={status}
		/>
	) : null}
	{isRoom ? (
		<RoomMembersDialog
			open={membersOpen}
			onOpenChange={setMembersOpen}
			members={memberEntries}
			title={title || "Chat Room Members"}
		/>
	) : null}
		</main>
	);
}
