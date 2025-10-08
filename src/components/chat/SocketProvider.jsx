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

const SOCKET_URL =
	process.env.NEXT_PUBLIC_SOCKET_URL ||
	(typeof window !== "undefined"
		? `${window.location.protocol}//${window.location.hostname}:${
				process.env.NEXT_PUBLIC_SOCKET_PORT || 4001
		  }`
		: "");

const SocketContext = createContext(null);

export default function SocketProvider({ children }) {
	const [socket, setSocket] = useState(null);
	const createdRef = useRef(false);

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

	

	const value = useMemo(() => socket, [socket]);
	return (
		<SocketContext.Provider value={value}>{children}</SocketContext.Provider>
	);
}

export function useSocket() {
	return useContext(SocketContext);
}
