// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function main() {
  // admin
  await prisma.user.upsert({
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
