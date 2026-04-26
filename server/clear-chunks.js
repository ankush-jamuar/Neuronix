const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const result = await prisma.documentChunk.deleteMany({});
  console.log(`Deleted ${result.count} DocumentChunks`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
