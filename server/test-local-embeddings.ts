import { generateEmbedding } from './src/services/ai/embeddingService';
import { prisma } from './src/lib/prisma';

async function runTest() {
  try {
    console.log("--- RUNNING LOCAL EMBEDDING TEST ---");
    
    const text = "Neuronix is an AI second brain. It helps organize knowledge and ideas using semantic search.";
    
    // 1. Generate Embedding
    console.log("Calling generateEmbedding...");
    const start = Date.now();
    const embedding = await generateEmbedding(text);
    console.log(`✅ Embedding generated in ${Date.now() - start}ms`);
    console.log(`Dimensions: ${embedding.length} (Expected: 384)`);
    
    // 2. We can also simulate note embeddings to see rows in DB if needed,
    // but just checking existing rows is fine if the user wants sample rows.
    // Let's create a temp note, process embeddings, then fetch rows.
    const tempNote = await prisma.note.create({
      data: {
        title: "Test Local Embeddings",
        textContent: text,
        content: { type: "doc", content: [] },
        userId: "test-user-id" // Might fail if foreign key constraint exists. We'll just fetch existing chunks first.
      }
    }).catch(e => null); // Ignore error if userId constraint fails
    
    const chunks = await prisma.$queryRaw`SELECT id, content, left(embedding::text, 50) as "embeddingPreview", "noteId" FROM "DocumentChunk" LIMIT 3;`;
    
    console.log("\n--- SAMPLE DocumentChunk ROWS ---");
    console.log(JSON.stringify(chunks, null, 2));

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
