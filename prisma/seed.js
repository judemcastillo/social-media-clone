// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const { faker } = require("@faker-js/faker");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
	faker.seed(123);

	const DEFAULT_PASSWORD = "Password123!";
	const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

	const skillPool = [
		"Design",
		"Product",
		"Frontend",
		"Backend",
		"Growth",
		"Marketing",
		"Community",
		"Content",
		"Data",
	];

	const admin = await prisma.user.upsert({
		where: { email: "admin@test.com" },
		update: {
			role: "ADMIN",
			name: "Admin",
			image: faker.image.avatar(),
			Credential: {
				upsert: {
					update: { passwordHash },
					create: { passwordHash },
				},
			},
		},
		create: {
			email: "admin@test.com",
			name: "Admin",
			role: "ADMIN",
			image: faker.image.avatar(),
			bio: "I keep the community running.",
			coverImageUrl: `https://picsum.photos/seed/${faker.string.uuid()}/1200/400`,
			skills: ["Community", "Product"],
			Credential: { create: { passwordHash } },
		},
	});

	const userCount = 18;
	const users = [];

	for (let i = 0; i < userCount; i += 1) {
		const email = faker.internet.email().toLowerCase();
		const bio = faker.helpers.maybe(
			() => faker.lorem.sentence({ min: 8, max: 16 }),
			{ probability: 0.8 }
		);
		const skills = faker.helpers.arrayElements(
			skillPool,
			faker.number.int({ min: 0, max: 4 })
		);

		const user = await prisma.user.upsert({
			where: { email },
			update: {
				name: faker.person.fullName(),
				image: faker.image.avatar(),
				bio,
				skills,
				coverImageUrl: `https://picsum.photos/seed/${faker.string.uuid()}/1200/400`,
				Credential: {
					upsert: {
						update: { passwordHash },
						create: { passwordHash },
					},
				},
			},
			create: {
				email,
				name: faker.person.fullName(),
				image: faker.image.avatar(),
				bio,
				skills,
				coverImageUrl: `https://picsum.photos/seed/${faker.string.uuid()}/1200/400`,
				role: "USER",
				Credential: { create: { passwordHash } },
			},
			select: { id: true },
		});

		users.push(user);
	}

	const allAuthors = [admin, ...users];
	const postData = [];
	const topicTags = [
		"launch",
		"community",
		"growth",
		"product",
		"design",
		"tech",
		"culture",
	];

	for (const author of allAuthors) {
		const postCount = faker.number.int({ min: 2, max: 6 });
		for (let i = 0; i < postCount; i += 1) {
			const paragraphCount = faker.number.int({ min: 1, max: 3 });
			const contentBody = faker.lorem.paragraphs(paragraphCount, "\n\n");
			const hashtags =
				faker.helpers.maybe(
					() =>
						`\n\n#${faker.helpers.arrayElement(topicTags)} #${faker.helpers.arrayElement(
							topicTags
						)}`
				) ?? "";
			const content = `${contentBody}${hashtags}`;

			const imageUrl = faker.helpers.maybe(
				() => `https://picsum.photos/seed/${faker.string.uuid()}/900/600`,
				{ probability: 0.35 }
			);
			const createdAt = faker.date.recent({ days: 30 });

			postData.push({
				authorId: author.id,
				content,
				imageUrl: imageUrl ?? null,
				createdAt,
				updatedAt: createdAt,
			});
		}
	}

	if (postData.length) {
		await prisma.post.createMany({ data: postData });
	}

	const roomTitles = ["New Members", "Yappers4Life", "Exclusive Yappers"];
	for (const title of roomTitles) {
		const existing = await prisma.conversation.findFirst({
			where: { title, isPublic: true },
			select: { id: true },
		});
		if (existing) continue;

		await prisma.conversation.create({
			data: {
				title,
				isGroup: true,
				isPublic: true,
				createdById: admin.id,
				participants: {
					create: [
						{
							userId: admin.id,
							role: "ADMIN",
							status: "JOINED",
						},
					],
				},
			},
		});
	}

	console.log(
		`Seeded ${allAuthors.length} users with password "${DEFAULT_PASSWORD}" and ${postData.length} posts.`
	);
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
