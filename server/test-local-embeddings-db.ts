import { processNoteEmbeddings } from './src/services/ai/embeddingPipeline';
import { prisma } from './src/lib/prisma';

async function runTest() {
  try {
    const text = "Neuronix is an AI second brain. It helps organize knowledge and ideas using semantic search.";
    
    // Create a dummy user and note
    const user = await prisma.user.create({
      data: {
        id: "test-user-" + Date.now(),
        email: "test" + Date.now() + "@test.com",
        firstName: "Test",
        lastName: "User"
      }
    });

    const tempNote = await prisma.note.create({
      data: {
        title: "Test Local Embeddings",
        textContent: text,
        content: { type: "doc", content: [] },
        userId: user.id
      }
    });
    
    // Process embeddings
    await processNoteEmbeddings(tempNote.id, tempNote.textContent!);
    
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
