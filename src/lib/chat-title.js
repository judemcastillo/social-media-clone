const DEFAULT_FALLBACK = "Conversation";
const DEFAULT_LIMIT = 3;

function normalizeName(user) {
	if (!user) return null;
	const name = (user.name || user.email || "").trim();
	return name || "User";
}

export function formatGroupTitle({
	participants = [],
	viewerId = null,
	maxNames = DEFAULT_LIMIT,
	fallback = DEFAULT_FALLBACK,
} = {}) {
	const limit = Number.isFinite(maxNames) && maxNames > 0 ? maxNames : DEFAULT_LIMIT;

	const unique = new Map();
	for (const user of participants) {
		if (!user) continue;
		const id = user.id ?? user.email ?? normalizeName(user);
		if (!id) continue;
		if (viewerId && user.id === viewerId) continue;
		if (!unique.has(id)) {
			unique.set(id, normalizeName(user));
		}
	}

	const names = Array.from(unique.values());
	if (!names.length) return fallback;

	const primary = names.slice(0, limit);
	const remaining = names.length - primary.length;
	const base = primary.join(", ");

	return remaining > 0 ? `${base} +${remaining}` : base;
}
