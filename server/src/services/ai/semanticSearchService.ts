import { analyzeQuery } from "./query-understanding";
import { performHybridSearch } from "./retrieval";
import { generateEmbedding } from "./embeddingService";
import { logger } from "../../utils/logger";

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
      score: r.finalScore // Exposing the hybrid score if needed
    });
  }

  return Array.from(map.values());
}

/**
 * @deprecated Use askAI or performHybridSearch directly for new features.
 * Wrapped legacy semanticSearch to use the new Hybrid Retrieval Pipeline.
 */
export async function semanticSearch(
  userId: string,
  query: string,
  topK = 10
) {
  if (!query || query.trim().length === 0) return [];

  // 1. Analyze Query
  const analysis = analyzeQuery(query);

  // 2. Embed Normalized Query
  const queryEmbedding = await generateEmbedding(analysis.normalizedQuery);

  // 3. Perform Hybrid Search
  const results = await performHybridSearch({
    userId,
    originalQuery: query,
    normalizedQuery: analysis.normalizedQuery,
    embedding: queryEmbedding,
    metadata: analysis.metadata,
    limit: topK * 2 // Over-fetch slightly to allow groupByNote to have enough chunks per note
  });

  logger.info("Legacy semanticSearch invoked via Hybrid Pipeline", {
    userId,
    query,
    resultCount: results.length
  });

  return groupByNote(results);
}