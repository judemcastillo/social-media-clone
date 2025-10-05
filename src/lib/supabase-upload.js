"use client";

export async function uploadToSupabase(file) {
	const fd = new FormData();
	fd.set("file", file);
	const res = await fetch("/api/upload/chat", { method: "POST", body: fd });
	if (!res.ok) throw new Error(await res.text());
	const { url } = await res.json();
	return url;
}
