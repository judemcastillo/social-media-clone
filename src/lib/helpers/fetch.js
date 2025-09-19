export async function fetchPosts({ limit = 10, cursor = null } = {}) {
	const params = new URLSearchParams({ limit: String(limit) });

	if (cursor) params.set("cursor", cursor);
	const res = await fetch(`/api/posts?${params.toString()}`, {
		method: "GET",
		cache: "no-store",
	});
	if (!res.ok) {
		throw new Error(`Failed to load posts (${res.status})`);
	}

	return res.json();
}

// src/lib/helpers/fetch-comments.js
export async function fetchComments({ postId, limit = 20, cursor = null }) {
	const params = new URLSearchParams({ limit: String(limit) });
	if (cursor) params.set("cursor", cursor);

	const res = await fetch(
		`/api/posts/${postId}/comments?${params.toString()}`,
		{
			cache: "no-store",
		}
	);
	if (!res.ok) throw new Error(`Failed to load comments (${res.status})`);
	return res.json(); // { items, nextCursor }
}
export async function fetchOnePost(postId) {
	const res = await fetch(`/api/posts/${postId}`, {
		method: "GET",
		cache: "no-store",
	});
	if (!res.ok) {
		throw new Error(`Failed to load posts (${res.status})`);
	}

	return res.json();
}
