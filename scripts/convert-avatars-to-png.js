// scripts/convert-avatars-to-png.js
import "dotenv/config";
import prisma from "../src/lib/prisma.js";

function toPng(url) {
	if (!url) return url;
	if (!url.includes("api.dicebear.com")) return url;
	let u = url.replace("/svg?", "/png?");
	u = u.replace(/([?&])scale=\d+/g, "$1size=256"); // replace scale with size
	return u;
}

async function main() {
	const users = await prisma.user.findMany({
		select: { id: true, image: true },
	});
	let updated = 0;
	for (const u of users) {
		const png = toPng(u.image);
		if (png && png !== u.image) {
			await prisma.user.update({ where: { id: u.id }, data: { image: png } });
			updated++;
		}
	}
	console.log(`Updated ${updated} users.`);
}
main().finally(() => prisma.$disconnect());
