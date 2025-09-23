import Image from "next/image";

function normalizeAvatar(url, size = 256) {
	try {
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

export function Avatar({ src, alt, size = 64, className = "" }) {
	const safeSrc = normalizeAvatar(src, size * 4); // request a larger PNG; Next will downscale
	return (
		<Image
			src={safeSrc}
			alt={alt || "avatar"}
			width={size}
			height={size}
			className={`rounded-full border-sky-300 border-2 p-[4px] aspect-square object-cover size-${size/4} ${className}`}
			unoptimized
		/>
	);
}
