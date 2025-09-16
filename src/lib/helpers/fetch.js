export async function fetchPosts({ limit = 10, cursor = null } = {}) {
	const params = new URLSearchParams({ limit: String(limit) });
	if (cursor) params.set("cursor", cursor);
	const res = await fetch(
		`${process.env.NEXTAUTH_URL}/api/posts?${params.toString()}`,
		{
			method: "GET",
			cache: "no-store",
		}
	);
	if (!res.ok) {
		throw new Error(`Failed to load posts (${res.status})`);
	}

	return res.json();
}
