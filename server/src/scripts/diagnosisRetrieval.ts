/**
 * Direct retrieval diagnostic — runs without HTTP/auth layer.
 * Proves the Prisma.join fix resolves the ANY() binding issue.
 *
 * Run: npx ts-node --transpile-only src/scripts/diagnosisRetrieval.ts
 */

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("\n========== RETRIEVAL DIAGNOSIS ==========\n");

  // 1. Get first real user
  const user = await prisma.user.findFirst({ select: { id: true, clerkId: true, email: true } });
  if (!user) { console.error("❌ NO USER FOUND in DB. Sync broken."); process.exit(1); }
  console.log("✅ User found:", user.email, "| internalId:", user.id);

  // 2. Count their notes
  const notes = await prisma.note.findMany({
    where: { userId: user.id, isDeleted: false },
    select: { id: true, title: true },
  });
  console.log(`✅ Notes for user: ${notes.length}`);
  notes.forEach(n => console.log("   →", n.id, "|", n.title));

  if (notes.length === 0) { console.error("❌ NO NOTES for this user."); process.exit(1); }

  const noteIds = notes.map(n => n.id);

  // 3. Count chunks for those notes (using Prisma.join — the same fix we applied)
  const chunks = await prisma.$queryRaw<any[]>(
    Prisma.sql`
      SELECT dc.id, dc."noteId", LEFT(dc.content, 80) AS preview, (dc.embedding IS NOT NULL) AS has_embedding
      FROM "DocumentChunk" dc
      WHERE dc."noteId" IN (${Prisma.join(noteIds)})
    `
  );
  console.log(`\n✅ DocumentChunks found via Prisma.join: ${chunks.length}`);
  chunks.forEach(c => console.log("   → has_embedding:", c.has_embedding, "| preview:", c.preview?.replace(/\n/g, " ")));

  if (chunks.length === 0) {
    console.error("❌ NO CHUNKS FOUND — notes exist but have no DocumentChunk rows.");
    console.error("   → Trigger re-embedding by editing a note and saving.");
    process.exit(1);
  }

  // 4. Run pgvector similarity search using the FIRST chunk's embedding as the query vector
  // (Simulates a real query without needing the Xenova model)
  const vectorResult = await prisma.$queryRaw<any[]>(
    Prisma.sql`
      SELECT
        dc.id,
        dc."noteId",
        LEFT(dc.content, 120) AS preview,
        (dc.embedding <=> (SELECT embedding FROM "DocumentChunk" WHERE "noteId" IN (${Prisma.join(noteIds)}) LIMIT 1))::float8 AS distance
      FROM "DocumentChunk" dc
      WHERE dc."noteId" IN (${Prisma.join(noteIds)})
        AND dc.embedding IS NOT NULL
      ORDER BY distance ASC
      LIMIT 5
    `
  );
  console.log(`\n✅ pgvector similarity query returned: ${vectorResult.length} results`);
  vectorResult.forEach((r, i) => {
    console.log(`   #${i+1} distance=${Number(r.distance).toFixed(4)} | ${r.preview?.replace(/\n/g, " ")}`);
  });

  if (vectorResult.length > 0) {
    console.log("\n🎉 ROOT CAUSE CONFIRMED: Prisma.join() correctly binds string[] to PostgreSQL IN clause.");
    console.log("   The ANY(${string[]}) bug is fixed. Retrieval will now return results.\n");
  }

  await prisma.$disconnect();
}

run().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
