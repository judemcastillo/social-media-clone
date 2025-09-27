export async function fetchPosts({ limit = 10, cursor = null } = {}) {
	const params = new URLSearchParams({ limit: String(limit) });

	if (cursor) params.set("cursor", cursor);
	const res = await fetch(`/api/posts?${params.toString()}`, {
		method: "GET",
		cache: "no-store",
		credentials: "include",
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
			credentials: "include",
		}
	);
	if (!res.ok) throw new Error(`Failed to load comments (${res.status})`);
	return res.json(); // { items, nextCursor }
}
export async function fetchOnePost(postId) {
	const res = await fetch(`/api/posts/${postId}`, {
		method: "GET",
		cache: "no-store",
		credentials: "include",
	});
	if (!res.ok) {
		throw new Error(`Failed to load posts (${res.status})`);
	}

	return res.json();
}

export async function fetchPostsServer({ limit = 10, cursor = null } = {}) {
	const { cookies, headers } = await import("next/headers"); // ✅ server-only
	const params = new URLSearchParams({ limit: String(limit) });
	if (cursor) params.set("cursor", cursor);

	// Build base URL robustly (works in dev and prod)
	const hdrs = await headers();
	const cookieStore = await cookies();
	const proto = hdrs.get("x-forwarded-proto") || "http";
	const host = hdrs.get("host");
	const base = process.env.NEXTAUTH_URL || `${proto}://${host}`;

	const res = await fetch(`${base}/api/posts?${params.toString()}`, {
		method: "GET",
		cache: "no-store",
		headers: {
			cookie: cookieStore.toString(), // ✅ forward session cookies
		},
	});
	if (!res.ok) throw new Error(`Failed to load posts (${res.status})`);
	return res.json();
}

export async function fetchOneUser(id) {
	const res = await fetch(`/api/users/${id}`, {
		method: "GET",
		cache: "no-store",
		credentials: "include",
	});
	if (!res.ok) {
		throw new Error(`Failed to load user (${res.status})`);
	}

	return res.json();
}
export async function fetchOneUserServer(id) {
	const res = await fetch(`${process.env.NEXTAUTH_URL}/api/users/${id}`, {
		method: "GET",
		cache: "no-store",
		credentials: "include",
	});
	if (!res.ok) {
		throw new Error(`Failed to load user (${res.status})`);
	}
	console.log(res.json);
	return res.json();
}
