import { prisma } from "../../lib/prisma";
import { generateEmbedding } from "./embeddingService";

function groupByNote(results: any[]) {
  const map = new Map();

  for (const r of results) {
    if (!map.has(r.noteId)) {
      map.set(r.noteId, {
        noteId: r.noteId,
        chunks: [],
      });
    }

    map.get(r.noteId).chunks.push({
      content: r.content,
      distance: r.distance,
    });
  }

  return Array.from(map.values());
}

export async function semanticSearch(
  userId: string,
  query: string,
  topK = 10
) {
  if (!query || query.trim().length === 0) return [];

  const queryEmbedding = await generateEmbedding(query);

  const results = await prisma.$queryRaw`
    SELECT 
      dc.id,
      dc.content,
      dc."noteId",
      dc.embedding <=> ${JSON.stringify(queryEmbedding)}::vector AS distance
    FROM "DocumentChunk" dc
    JOIN "Note" n ON dc."noteId" = n.id
    WHERE n."userId" = ${userId}
      AND n."isDeleted" = false
    ORDER BY dc.embedding <=> ${JSON.stringify(queryEmbedding)}::vector
    LIMIT ${topK}
  `;

  console.log("Semantic results:", results);

  return groupByNote(results as any[]);
}