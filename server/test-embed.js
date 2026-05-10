const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const chunks = await prisma.$queryRaw`SELECT embedding::text FROM "DocumentChunk" LIMIT 1`;
  console.log(chunks);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
