import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Testing Prisma Connection...");
  
  // Create a dummy user
  const newUser = await prisma.user.create({
    data: {
      clerkId: "test_clerk_" + Date.now(),
      email: "test_" + Date.now() + "@example.com",
      name: "Test User",
    },
  });

  console.log("✅ Successfully created user:", newUser.id);

  // Read users
  const allUsers = await prisma.user.findMany();
  console.log(`✅ Connection successful! Found ${allUsers.length} users in the database.`);
}

main()
  .catch((e) => {
    console.error("❌ Database connection failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
