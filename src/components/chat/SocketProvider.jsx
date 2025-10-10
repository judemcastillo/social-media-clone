// components/chat/SocketProvider.jsx
"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { io } from "socket.io-client";
import { useUser } from "@/components/providers/user-context";

const SOCKET_URL =
	process.env.NEXT_PUBLIC_SOCKET_URL ||
	(typeof window !== "undefined"
		? `${window.location.protocol}//${window.location.hostname}:${
				process.env.NEXT_PUBLIC_SOCKET_PORT || 4001
		  }`
		: "");

const SocketContext = createContext({ socket: null, onlineUsers: [] });

export default function SocketProvider({ children }) {
	const [socket, setSocket] = useState(null);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const createdRef = useRef(false);
	const viewer = useUser();
	const viewerId = viewer?.id;

	useEffect(() => {
		if (createdRef.current) return;
		createdRef.current = true;

		let s;

		async function connect() {
			try {
				// fetch a short-lived JWT for the handshake
				const res = await fetch("/api/socket-token", {
					credentials: "include",
				});
				if (!res.ok) throw new Error("no token");
				const { token } = await res.json();

				s = io(SOCKET_URL, {
					transports: ["websocket"],
					withCredentials: true,
					auth: { token }, // <<< send token
					autoConnect: true,
					reconnection: true,
					reconnectionAttempts: Infinity,
					reconnectionDelayMax: 5000,
				});

				s.on("connect_error", async (err) => {
					console.error("[socket] connect_error", err?.message || err);
					// if token expired, fetch a new one and update auth, then try reconnect
					if (err?.message?.toLowerCase().includes("auth failed")) {
						try {
							const r = await fetch("/api/socket-token", {
								credentials: "include",
							});
							if (r.ok) {
								const { token: next } = await r.json();
								s.auth = { token: next };
								s.connect();
							}
						} catch {}
					}
				});

				setSocket(s);
			} catch (e) {
				console.error("[socket] init failed", e);
			}
		}

		connect();

		return () => {
			s?.removeAllListeners();
			s?.close();
		};
	}, []);

	useEffect(() => {
		if (!socket || !viewerId) return;

		const announceOnline = () => socket.emit("addNewUser", viewerId);

		announceOnline();
		socket.on("connect", announceOnline);
		return () => {
			socket.off("connect", announceOnline);
		};
	}, [socket, viewerId]);

	useEffect(() => {
		if (!socket) return;
		const handleOnlineUsers = (list) => {
			setOnlineUsers(Array.isArray(list) ? list : []);
		};
		const handleDisconnect = () => setOnlineUsers([]);

		socket.on("getOnlineUsers", handleOnlineUsers);
		socket.on("disconnect", handleDisconnect);

		return () => {
			socket.off("getOnlineUsers", handleOnlineUsers);
			socket.off("disconnect", handleDisconnect);
		};
	}, [socket]);

	const value = useMemo(
		() => ({ socket, onlineUsers }),
		[socket, onlineUsers]
	);

	return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
	const ctx = useContext(SocketContext);
	return ctx?.socket ?? null;
}

export function useOnlineUsers() {
	const ctx = useContext(SocketContext);
	return ctx?.onlineUsers ?? [];
}
