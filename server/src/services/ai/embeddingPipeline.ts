// ─── Embedding Pipeline ───────────────────────────────────────────────────────
//
// Orchestrates the full note → vector embedding lifecycle:
//   1. Delete existing DocumentChunk rows for the note (clean slate on update)
//   2. Split textContent into overlapping chunks
//   3. Generate a 384-dim embedding per chunk via HuggingFace
//   4. Insert each chunk + embedding into DocumentChunk via raw SQL
//
// WHY raw SQL for insert?
//   Prisma does not support the pgvector `vector(384)` type natively.
//   The `::vector` cast in the INSERT converts a JSON float array to pgvector format.
//
// IMPORTANT: This function must always be called inside a try/catch by the caller.
// It is designed to be fire-and-forget — embedding failures MUST NOT break the API.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../../lib/prisma';
import { generateEmbedding } from './embeddingService';
import { chunkText } from '../../utils/chunkText';

/**
 * Processes and stores embeddings for a note's text content.
 *
 * @param noteId      - UUID of the note being embedded
 * @param textContent - Plain text content of the note (no HTML/JSON markup)
 */
export async function processNoteEmbeddings(
  noteId: string,
  textContent: string
): Promise<void> {
  // Guard: skip embedding for blank notes — no API calls wasted
  if (!textContent || textContent.trim().length === 0) {
    return;
  }

  // Step 1: Delete stale chunks from a previous save of this note
  await prisma.documentChunk.deleteMany({
    where: { noteId },
  });

  // Step 2: Chunk the plain text
  const cleanText = textContent.replace(/<[^>]*>/g, "").trim();
  const chunks = chunkText(cleanText);

  console.log("Total chunks:", chunks.length);
  console.log("Chunks preview:", chunks.slice(0, 2));

  // Step 3 + 4: Embed and persist each chunk sequentially
  // Sequential (not parallel) to respect HuggingFace free-tier rate limits.
  for (const chunk of chunks) {
    console.log("Calling HF API...");
    if (!chunk.trim()) continue;

    const embedding = await generateEmbedding(chunk);

    // Raw SQL insert: Prisma can't handle vector(384) columns directly.
    // JSON.stringify(embedding) produces "[0.123, 0.456, ...]"
    // The ::vector cast converts that string to a pgvector value.
    await prisma.$executeRaw`
      INSERT INTO "DocumentChunk" (id, content, embedding, "noteId", "createdAt")
      VALUES (
        gen_random_uuid(),
        ${chunk},
        ${JSON.stringify(embedding)}::vector,
        ${noteId}::uuid,
        NOW()
      )
    `;
  }
}
