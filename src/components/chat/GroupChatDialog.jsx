"use client";

import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useTransition,
} from "react";
import {
	DialogClose,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar } from "../Avatar";
import { Loader2, Plus, Search, X } from "lucide-react";
import {
	loadMoreDiscoverAction,
	searchDiscoverAction,
} from "@/lib/actions/discover-actions";
import { createGroupConversation } from "@/lib/actions/conversation-actions";
import { useUser } from "../providers/user-context";
import { useSocket } from "./useSocket";

function dedupeUsers(list = []) {
	const seen = new Map();
	for (const user of list) {
		if (user?.id && !seen.has(user.id)) {
			seen.set(user.id, user);
		}
	}
	return Array.from(seen.values());
}

export default function GroupChatDialog({
	initialMembers = [],
	nextCursor = null,
	onCreated,
}) {
	const viewer = useUser();
	const socket = useSocket();

	const [members, setMembers] = useState(() => dedupeUsers(initialMembers));
	const [cursor, setCursor] = useState(nextCursor);
	const [selected, setSelected] = useState([]);
	const [title, setTitle] = useState("");
	const [query, setQuery] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, startSubmit] = useTransition();
	const [loadingMore, setLoadingMore] = useState(false);
	const [searching, setSearching] = useState(false);

	useEffect(() => {
		setMembers(dedupeUsers(initialMembers));
	}, [initialMembers]);

	useEffect(() => {
		setCursor(nextCursor);
	}, [nextCursor]);

	const selectedIds = useMemo(
		() => new Set(selected.map((u) => u.id)),
		[selected]
	);
	const availableMembers = useMemo(
		() => members.filter((u) => u?.id && !selectedIds.has(u.id)),
		[members, selectedIds]
	);

	const handleAddMember = useCallback((user) => {
		if (!user?.id) return;
		setSelected((prev) => {
			if (prev.some((m) => m.id === user.id)) return prev;
			return [...prev, user];
		});
	}, []);

	const handleRemoveMember = useCallback((userId) => {
		if (!userId) return;
		setSelected((prev) => prev.filter((m) => m.id !== userId));
	}, []);

	const resetToInitial = useCallback(() => {
		setMembers(dedupeUsers(initialMembers));
		setCursor(nextCursor);
	}, [initialMembers, nextCursor]);

	const handleSearch = useCallback(
		async (event) => {
			event.preventDefault();
			setError("");
			setSearching(true);
			try {
				const fd = new FormData();
				fd.set("q", query.trim());
				const res = await searchDiscoverAction(null, fd);
				if (res?.ok) {
					setMembers(dedupeUsers(res.users || []));
					setCursor(res.nextCursor || null);
				} else if (res?.error) {
					setError(res.error);
				} else {
					setError("Unable to search right now.");
				}
			} catch (err) {
				console.error("group chat search failed", err);
				setError("Unable to search right now.");
			} finally {
				setSearching(false);
			}
		},
		[query]
	);

	const handleLoadMore = useCallback(async () => {
		if (!cursor) return;
		setError("");
		setLoadingMore(true);
		try {
			const fd = new FormData();
			fd.set("cursor", cursor);
			fd.set("q", query.trim());
			const res = await loadMoreDiscoverAction(null, fd);
			if (res?.ok) {
				setMembers((prev) => dedupeUsers([...prev, ...(res.users || [])]));
				setCursor(res.nextCursor || null);
			} else if (res?.error) {
				setError(res.error);
			} else {
				setError("Unable to load more members right now.");
			}
		} catch (err) {
			console.error("group chat load more failed", err);
			setError("Unable to load more members right now.");
		} finally {
			setLoadingMore(false);
		}
	}, [cursor, query]);

	const handleCreate = useCallback(() => {
		if (!selected.length) {
			setError("Select at least one member.");
			return;
		}
		const memberIds = selected.map((m) => m.id);
		const trimmedTitle = title.trim();

		setError("");
		startSubmit(async () => {
			try {
				const result = await createGroupConversation({
					title: trimmedTitle,
					memberIds,
				});
				if (!result?.ok || !result.conversationId) {
					setError(result?.error || "Failed to create group.");
					return;
				}

				const conversation = {
					id: result.conversationId,
					title: trimmedTitle || null,
					isGroup: true,
					isPublic: false,
					unreadCount: 0,
					messages: [],
					updatedAt: new Date().toISOString(),
					participants: [
						viewer?.id
							? {
									user: {
										id: viewer.id,
										name: viewer.name,
										image: viewer.image,
									},
							  }
							: null,
						...selected.map((user) => ({ user })),
					].filter(Boolean),
				};

				onCreated?.(conversation);
				socket?.emit("conversation:join", {
					conversationId: result.conversationId,
				});

				setTitle("");
				setSelected([]);
			} catch (err) {
				console.error("group chat create failed", err);
				setError("Failed to create group. Please try again.");
			}
		});
	}, [selected, title, onCreated, socket, viewer]);

	return (
		<>
			<DialogHeader>
				<DialogTitle>Create Group Chat</DialogTitle>
				<DialogDescription>
					Choose one or more people to start a new conversation.
				</DialogDescription>
			</DialogHeader>

			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="group-title">Group name (optional)</Label>
					<Input
						id="group-title"
						autoComplete="off"
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						placeholder="Project launch, Weekend plans…"
					/>
				</div>

				<div className="space-y-2">
					<Label>Selected members</Label>
					{selected.length ? (
						<ScrollArea className="h-[150px] pr-3 overflow-y-auto">
							{selected.map((user) => (
								<Card
									key={user.id}
									className="p-2 text-sm flex flex-row justify-between items-center rounded-none"
								>
									<div className="flex flex-row items-center gap-2">
										<Avatar
											src={user.image}
											size={30}
											dotSize={3}
											userId={user.id}
										/>
										<div>{user.name}</div>
									</div>
									<button
										type="button"
										onClick={() => handleRemoveMember(user.id)}
										className="text-secondary hover:text-destructive"
										aria-label={`Remove ${user.name}`}
									>
										<X className="size-4" />
									</button>
								</Card>
							))}
						</ScrollArea>
					) : (
						<p className="text-sm text-muted-foreground">
							No one selected yet.
						</p>
					)}
				</div>

				<div className="space-y-2">
					<form onSubmit={handleSearch} className="flex gap-2">
						<Input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search people by name, email, or bio…"
						/>
						<Button
							type="submit"
							variant="secondary"
							className="cursor-pointer"
							disabled={searching}
						>
							{searching ? (
								<>
									<Loader2 className="size-4 animate-spin" />
									<span className="sr-only">Searching</span>
								</>
							) : (
								<>
									<Search className="size-4" />
									<span className="sr-only">Search</span>
								</>
							)}
						</Button>
						<Button
							type="button"
							variant="ghost"
							className="cursor-pointer"
							onClick={() => {
								setQuery("");
								setError("");
								resetToInitial();
							}}
							disabled={searching}
						>
							Clear
						</Button>
					</form>
				</div>

				<div className="space-y-2">
					<Label>Add members</Label>
					<ScrollArea className="h-[150px] pr-3 overflow-y-auto">
						<div>
							{availableMembers.map((user) => (
								<Card
									key={user.id}
									className="p-2 text-sm flex flex-row justify-between items-center rounded-none"
								>
									<div className="flex flex-row items-center gap-2">
										<Avatar
											src={user.image}
											size={30}
											dotSize={3}
											userId={user.id}
										/>
										<div>{user.name}</div>
									</div>
									<button
										type="button"
										onClick={() => handleAddMember(user)}
										className="text-secondary hover:text-accent-foreground"
										aria-label={`Add ${user.name}`}
									>
										<Plus className="size-4" />
									</button>
								</Card>
							))}

							{!availableMembers.length && (
								<p className="text-sm text-muted-foreground">
									{searching ? "Searching…" : "No people match your search."}
								</p>
							)}
						</div>
					</ScrollArea>
					{cursor && (
						<div className="flex justify-center">
							<Button
								type="button"
								variant="ghost"
								className="cursor-pointer text-muted-foreground"
								onClick={handleLoadMore}
								disabled={loadingMore}
							>
								{loadingMore ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Loading…
									</>
								) : (
									"Load more"
								)}
							</Button>
						</div>
					)}
				</div>

				{error && <p className="text-sm text-destructive">{error}</p>}
			</div>

			<DialogFooter>
				<DialogClose asChild>
					<Button
						type="button"
						variant="outline"
						className="cursor-pointer"
						disabled={isSubmitting}
					>
						Cancel
					</Button>
				</DialogClose>
				<Button
					type="button"
					onClick={handleCreate}
					className="cursor-pointer"
					disabled={isSubmitting || !selected.length}
				>
					{isSubmitting ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Creating…
						</>
					) : (
						"Create"
					)}
				</Button>
			</DialogFooter>
		</>
	);
}
