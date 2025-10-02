// src/lib/socket-client.js
"use client";
import { io } from "socket.io-client";

let socketPromise = null;

export async function getSocket() {
	if (socketPromise) return socketPromise;

	socketPromise = (async () => {
		const res = await fetch("/api/socket/token", { method: "POST" });
		const { token } = await res.json();

		const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4001";
		const s = io(url, { auth: { token } });

		return new Promise((resolve, reject) => {
			s.on("connect", () => resolve(s));
			s.on("connect_error", reject);
		});
	})();

	return socketPromise;
}
