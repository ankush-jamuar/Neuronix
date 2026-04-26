const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const result = await prisma.$executeRaw`
    UPDATE "User"
    SET "clerkId" = 'user_3Cu8SKVQ5hdLtmt36mGJOFcQTuH'
    WHERE "clerkId" != 'user_3Cu8SKVQ5hdLtmt36mGJOFcQTuH';
  `;
  console.log(`Updated ${result} users to have the proper clerkId`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
