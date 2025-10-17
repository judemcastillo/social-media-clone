"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useSocket } from "@/components/chat/useSocket";
import { useUser } from "./user-context";

const UnreadContext = createContext({
	unreadTotal: 0,
	syncUnreadTotal: () => {},
	incrementUnread: () => {},
	decrementUnread: () => {},
	setActiveConversation: () => {},
});

export function UnreadProvider({ initialUnread = 0, children }) {
	const viewer = useUser();
	const viewerId = viewer?.id ?? null;
	const socket = useSocket();
	const [unreadTotal, setUnreadTotal] = useState(
		Math.max(0, Number(initialUnread) || 0)
	);
	const activeConversationRef = useRef(null);
	const seenIdsRef = useRef(new Set());
	const seenOrderRef = useRef([]);

	const syncUnreadTotal = useCallback((next) => {
		const value = Math.max(0, Number(next) || 0);
		setUnreadTotal((prev) => (prev === value ? prev : value));
	}, []);

	const incrementUnread = useCallback((count = 1) => {
		const amount = Math.max(0, Number(count) || 0);
		if (!amount) return;
		setUnreadTotal((prev) => prev + amount);
	}, []);

	const decrementUnread = useCallback((count = 1) => {
		const amount = Math.max(0, Number(count) || 0);
		if (!amount) return;
		setUnreadTotal((prev) => (prev - amount < 0 ? 0 : prev - amount));
	}, []);

	const setActiveConversation = useCallback((conversationId) => {
		activeConversationRef.current = conversationId || null;
	}, []);

	useEffect(() => {
		if (!socket || !viewerId) return;

		const onNewMessage = ({ message }) => {
			if (!message?.id) return;
			if (seenIdsRef.current.has(message.id)) return;

			seenIdsRef.current.add(message.id);
			seenOrderRef.current.push(message.id);
			if (seenOrderRef.current.length > 200) {
				const oldest = seenOrderRef.current.shift();
				if (oldest) seenIdsRef.current.delete(oldest);
			}

			if (!message.conversationId) return;
			const authorId = message.author?.id;
			if (!authorId || authorId === viewerId) return;
			if (activeConversationRef.current === message.conversationId) return;

			incrementUnread(1);
		};

		socket.on("message:new", onNewMessage);
		return () => socket.off("message:new", onNewMessage);
	}, [socket, viewerId, incrementUnread]);

	const value = useMemo(
		() => ({
			unreadTotal,
			syncUnreadTotal,
			incrementUnread,
			decrementUnread,
			setActiveConversation,
		}),
		[
			unreadTotal,
			syncUnreadTotal,
			incrementUnread,
			decrementUnread,
			setActiveConversation,
		]
	);

	return <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>;
}

export function useUnread() {
	return useContext(UnreadContext);
}
