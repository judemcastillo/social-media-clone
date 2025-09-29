export function sleep(ms = 800) {
	return new Promise((r) => setTimeout(r, ms));
}
