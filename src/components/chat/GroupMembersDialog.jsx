"use client";

import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useTransition,
} from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/Avatar";
import { Loader2, Plus, Search, Trash2, X } from "lucide-react";
import {
	addGroupMembers,
	removeGroupMember,
} from "@/lib/actions/conversation-actions";
import {
	loadMoreDiscoverAction,
	searchDiscoverAction,
} from "@/lib/actions/discover-actions";

function normalizeUsers(list = []) {
	const seen = new Map();
	for (const user of list) {
		if (!user?.id) continue;
		if (seen.has(user.id)) continue;
		seen.set(user.id, user);
	}
	return Array.from(seen.values());
}

function memberLabel(role, status) {
	if (role === "ADMIN") return "Admin";
	if (status === "INVITED") return "Invited";
	return "Member";
}

export default function GroupMembersDialog({
	open,
	onOpenChange,
	conversationId,
	members = [],
	onMembersChange,
	viewerId,
	viewerRole,
	viewerStatus,
}) {
	const [query, setQuery] = useState("");
	const [error, setError] = useState("");
	const [currentMembers, setCurrentMembers] = useState(members || []);
	const [selected, setSelected] = useState([]);
	const [results, setResults] = useState([]);
	const [cursor, setCursor] = useState(null);
	const [searching, setSearching] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [removalId, setRemovalId] = useState(null);
	const [adding, startAdding] = useTransition();
	const [removing, startRemoving] = useTransition();

	const viewerIsAdmin = viewerRole === "ADMIN" && viewerStatus !== "LEFT";

	useEffect(() => {
		if (open) {
			setCurrentMembers(members || []);
		} else {
			setQuery("");
			setError("");
			setSelected([]);
			setResults([]);
			setCursor(null);
			setSearching(false);
			setLoadingMore(false);
		}
	}, [open, members]);

	const currentMemberIds = useMemo(
		() =>
			new Set(
				(currentMembers || [])
					.map((m) => m?.user?.id)
					.filter(Boolean)
			),
		[currentMembers]
	);
	const selectedIds = useMemo(
		() => new Set(selected.map((u) => u.id)),
		[selected]
	);

	const filteredResults = useMemo(
		() =>
			results.filter(
				(user) =>
					user?.id &&
					user.role !== "GUEST" &&
					!currentMemberIds.has(user.id) &&
					!selectedIds.has(user.id)
			),
		[results, currentMemberIds, selectedIds]
	);

	const handleAddSelect = useCallback((user) => {
		if (!user?.id) return;
		setSelected((prev) => {
			if (prev.some((m) => m.id === user.id)) return prev;
			return [...prev, user];
		});
	}, []);

	const handleRemoveSelect = useCallback((userId) => {
		setSelected((prev) => prev.filter((m) => m.id !== userId));
	}, []);

	const runSearch = useCallback(
		async (event) => {
			event?.preventDefault?.();
			if (!viewerIsAdmin) return;
			setError("");
			setSearching(true);
			try {
				const fd = new FormData();
				fd.set("q", query.trim());
				const res = await searchDiscoverAction(null, fd);
				if (res?.ok) {
					setResults(normalizeUsers(res.users || []));
					setCursor(res.nextCursor || null);
				} else {
					setError(res?.error || "Unable to search right now.");
				}
			} catch (err) {
				console.error("group members search failed", err);
				setError("Unable to search right now.");
			} finally {
				setSearching(false);
			}
		},
		[query, viewerIsAdmin]
	);

	const handleLoadMore = useCallback(async () => {
		if (!viewerIsAdmin || !cursor) return;
		setError("");
		setLoadingMore(true);
		try {
			const fd = new FormData();
			fd.set("cursor", cursor);
			fd.set("q", query.trim());
			const res = await loadMoreDiscoverAction(null, fd);
			if (res?.ok) {
				setResults((prev) =>
					normalizeUsers([...prev, ...(res.users || [])])
				);
				setCursor(res.nextCursor || null);
			} else {
				setError(res?.error || "Unable to load more results.");
			}
		} catch (err) {
			console.error("group members load more failed", err);
			setError("Unable to load more results.");
		} finally {
			setLoadingMore(false);
		}
	}, [cursor, query, viewerIsAdmin]);

	const handleSubmitAdd = useCallback(() => {
		if (!viewerIsAdmin) return;
		if (!selected.length) {
			setError("Select at least one member to add.");
			return;
		}
		setError("");
		const memberIds = selected.map((u) => u.id);
		startAdding(async () => {
			try {
				const res = await addGroupMembers({ conversationId, memberIds });
				if (!res?.ok) {
					setError(res?.error || "Failed to add members.");
					return;
				}
				setSelected([]);
				setResults([]);
				setCursor(null);
				setCurrentMembers(res.participants || []);
				onMembersChange?.(
					res.participants || [],
					res.viewerRole,
					res.viewerStatus
				);
			} catch (err) {
				console.error("addGroupMembers failed", err);
				setError("Failed to add members.");
			}
		});
	}, [viewerIsAdmin, selected, conversationId, onMembersChange, startAdding]);

	const handleRemoveMember = useCallback(
		(userId) => {
			if (!viewerIsAdmin || !userId) return;
			setError("");
			setRemovalId(userId);
			startRemoving(async () => {
				try {
					const res = await removeGroupMember({ conversationId, memberId: userId });
					if (!res?.ok) {
						setError(res?.error || "Failed to remove member.");
						return;
					}
					setCurrentMembers(res.participants || []);
					onMembersChange?.(
						res.participants || [],
						res.viewerRole,
						res.viewerStatus
					);
				} catch (err) {
					console.error("removeGroupMember failed", err);
					setError("Failed to remove member.");
				} finally {
					setRemovalId(null);
				}
			});
		},
		[viewerIsAdmin, conversationId, onMembersChange, startRemoving]
	);

	const activeSelection = selected.length > 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="space-y-4 sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Group Members</DialogTitle>
					<DialogDescription>
						View members and manage invitations for this chat.
					</DialogDescription>
				</DialogHeader>

				<section className="space-y-3">
					<div className="flex items-center justify-between">
						<Label className="text-sm font-medium text-muted-foreground">
							Current Members
						</Label>
						<span className="text-xs text-muted-foreground">
							{currentMembers.length} total
						</span>
					</div>
					<ScrollArea className="h-[190px] rounded-md border border-border p-2 space-y-2 pr-3">
						{currentMembers.length === 0 ? (
							<div className="text-xs text-muted-foreground">
								No members yet.
							</div>
						) : (
							currentMembers.map((member) => {
								const user = member?.user;
								if (!user) return null;
								const removable =
									viewerIsAdmin &&
									user.id !== viewerId &&
									member.role !== "ADMIN";
								return (
									<div
										key={user.id}
										className="flex items-center justify-between gap-3 bg-accent px-2 py-2"
									>
										<span className="flex items-center gap-3">
											<Avatar src={user.image} size={32} userId={user.id} />
											<span className="flex flex-col">
												<span className="text-sm font-medium">
													{user.name || user.email || "User"}
												</span>
												<span className="text-xs text-muted-foreground">
													{memberLabel(member.role, member.status)}
												</span>
											</span>
										</span>
										{removable ? (
											<Button
												variant="ghost"
												size="icon"
												className="text-red-500 hover:text-red-600"
												onClick={() => handleRemoveMember(user.id)}
												disabled={removing && removalId === user.id}
											>
												{removing && removalId === user.id ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<Trash2 className="h-4 w-4" />
												)}
											</Button>
										) : null}
									</div>
								);
							})
						)}
					</ScrollArea>
				</section>

				{viewerIsAdmin ? (
					<section className="space-y-3">
						<div className="space-y-2">
							<Label htmlFor="member-search" className="text-sm font-medium">
								Add Members
							</Label>
							<form onSubmit={runSearch} className="relative">
								<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									id="member-search"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder="Search by name or email…"
									className="pl-9 pr-24"
								/>
								<Button
									type="submit"
									variant="secondary"
									className="absolute right-1 top-1 h-7 text-xs px-3 py-0"
									disabled={searching}
								>
									{searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
								</Button>
							</form>
						</div>

						{selected.length > 0 ? (
							<div className="space-y-2">
								<h4 className="text-sm font-medium">Pending invite</h4>
								<div className="flex flex-wrap gap-2">
									{selected.map((user) => (
										<span
											key={user.id}
											className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs"
										>
											{user.name || user.email || "User"}
											<button
												type="button"
												className="text-muted-foreground hover:text-foreground"
												onClick={() => handleRemoveSelect(user.id)}
											>
												<X className="h-3 w-3" />
											</button>
										</span>
									))}
								</div>
							</div>
						) : null}

						<ScrollArea className="max-h-44 rounded-md border border-border p-2 space-y-2">
							{filteredResults.length === 0 ? (
								<div className="text-xs text-muted-foreground">
									{searching
										? "Searching…"
										: query
										? "No matches found."
										: "Search to find people to invite."}
								</div>
							) : (
								filteredResults.map((user) => (
									<div
										key={user.id}
										className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-accent"
									>
										<span className="flex items-center gap-3">
											<Avatar src={user.image} size={32} userId={user.id} />
											<span className="flex flex-col">
												<span className="text-sm font-medium">
													{user.name || user.email || "User"}
												</span>
												<span className="text-xs text-muted-foreground">
													{user.email}
												</span>
											</span>
										</span>
										<Button
											variant="secondary"
											size="icon"
											className="h-7 w-7"
											onClick={() => handleAddSelect(user)}
										>
											<Plus className="h-4 w-4" />
										</Button>
									</div>
								))
							)}
							{cursor && filteredResults.length > 0 ? (
								<Button
									variant="ghost"
									className="w-full text-xs"
									onClick={handleLoadMore}
									disabled={loadingMore}
								>
									{loadingMore ? "Loading…" : "Load more"}
								</Button>
							) : null}
						</ScrollArea>

						<Button
							onClick={handleSubmitAdd}
							disabled={!activeSelection || adding}
							className="w-full"
						>
							{adding ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Adding…
								</>
							) : (
								"Add selected members"
							)}
						</Button>
					</section>
				) : null}

				{error ? <p className="text-xs text-red-500">{error}</p> : null}

				<DialogFooter className="justify-end">
					<Button variant="secondary" onClick={() => onOpenChange?.(false)}>
						Done
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
