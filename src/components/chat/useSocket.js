// src/components/chat/useSocket.js
"use client";
import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket-client";

export function useSocket() {
	const [socket, setSocket] = useState(null);
	useEffect(() => {
		let active = true;
		getSocket()
			.then((s) => active && setSocket(s))
			.catch(console.error);
		return () => {
			active = false;
		};
	}, []);
	return socket;
}
