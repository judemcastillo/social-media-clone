"use client";

import { dicebearAvatar } from "@/lib/avatar";
import Image from "next/image";
import { useOnlineUsers } from "./chat/useSocket";

function normalizeAvatar(url, size = 256) {
	try {
		if (url === null) {
			url = dicebearAvatar(12);
			return url;
		}
		const u = new URL(url);
		if (u.hostname === "api.dicebear.com" && u.pathname.includes("/svg")) {
			u.pathname = u.pathname.replace("/svg", "/png");
			u.searchParams.delete("scale");
			if (!u.searchParams.has("size")) u.searchParams.set("size", String(size));
			return u.toString();
		}
	} catch {}
	return url;
}

export function Avatar({
	src,
	alt,
	size = 24,
	className = "",
	dotSize = 3.5,
	userId = "",
	// isOnline = false,
}) {
	const safeSrc = normalizeAvatar(src, size * 4); // request a larger PNG; Next will downscale
	const onlineUsers = useOnlineUsers();
	const isOnline = onlineUsers.some(
		(u) => (u?.userId ?? u?.id ?? "") === userId
	);
	return (
		<div
			className={`grid grid-cols-1 rounded-full grid-rows-1 size-${
				size / 4
			} relative`}
		>
			<Image
				src={safeSrc}
				alt={alt || "avatar"}
				width={size}
				height={size}
				className={`rounded-full border-sky-300 col-span-1 row-span-1 row-start-1 col-start-1 border-2 p-[4px] aspect-square object-cover size-${
					size / 4
				} ${className}`}
				unoptimized
				loading="lazy"
			/>
			{userId && (
				<div
					className={`absolute size-${dotSize} rounded-full border-2 border-background col-span-1 row-span-1 row-start-1 z-10 col-start-1 top-[4%] ${
						isOnline ? "bg-green-400" : "bg-gray-400"
					}`}
				></div>
			)}
		</div>
	);
}
