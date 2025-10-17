// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function main() {
  // admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: { role: 'ADMIN' },
    create: {
      email: 'admin@test.com',
      name: 'Admin',
      role: 'ADMIN',
      image: faker.image.avatar(),
    },
  });

  // a few regular users
  const users = Array.from({ length: 6 }).map(() => ({
    email: faker.internet.email().toLowerCase(),
    name: faker.person.fullName(),
    image: faker.image.avatar(),
  }));

  await prisma.user.createMany({ data: users, skipDuplicates: true });

  const roomTitles = ['New Members', 'Yappers4Life', 'Exclusive Yappers'];
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
              role: 'ADMIN',
              status: 'JOINED',
            },
          ],
        },
      },
    });
  }
}

main()
  .then(async () => {
    console.log('Seeded users.');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
