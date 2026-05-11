import { prisma } from "../../../lib/prisma";
import { buildMetadataFilters } from "./filterBuilder";
import { scoreAndRankChunks } from "./ranking";
import { PerformHybridSearchParams, HybridSearchResult } from "./types";
import { logger } from "../../../utils/logger";

/**
 * Executes a hybrid retrieval pipeline.
 * Steps:
 * 1. Filter candidates via Prisma (Metadata)
 * 2. Retrieve top-k semantic matches via pgvector (Semantic)
 * 3. Score keyword relevance (Keyword)
 * 4. Apply Ranking Pipeline
 */
export async function performHybridSearch(params: PerformHybridSearchParams): Promise<HybridSearchResult[]> {
  const { userId, originalQuery, normalizedQuery, embedding, metadata, limit = 10 } = params;
  
  const startTime = Date.now();

  // 1. Build strict Prisma filters
  const filters = buildMetadataFilters(userId, metadata);

  // 2. Fetch candidate Note IDs with hard limits for scalability
  const candidateNotes = await prisma.note.findMany({
    where: filters,
    select: { id: true },
    take: 1000 // Safely limit maximum candidate set
  });

  const candidateNoteIds = candidateNotes.map(n => n.id);

  if (candidateNoteIds.length === 0) {
    logger.info("Hybrid search yielded no candidates after metadata filtering", { 
      userId, 
      appliedFilters: filters 
    });
    return [];
  }

  // 3. pgvector Semantic Search scoped to candidates
  const vectorLimit = limit * 2; // Over-fetch for re-ranking

  // We cast embedding to string, then vector. We use ANY($1) for the UUID array.
  const rawResults = await prisma.$queryRaw<any[]>`
    SELECT 
      dc.id,
      dc.content,
      dc."noteId",
      dc.embedding <=> ${JSON.stringify(embedding)}::vector AS distance
    FROM "DocumentChunk" dc
    WHERE dc."noteId" = ANY(${candidateNoteIds})
    ORDER BY dc.embedding <=> ${JSON.stringify(embedding)}::vector
    LIMIT ${vectorLimit}
  `;

  // 4. Keyword relevance scoring
  const keywords = normalizedQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  const mappedResults: HybridSearchResult[] = rawResults.map(r => {
    const contentLower = (r.content || "").toLowerCase();
    let keywordScore = 0;
    
    for (const kw of keywords) {
      if (contentLower.includes(kw)) {
        keywordScore++;
      }
    }

    return {
      id: r.id,
      content: r.content,
      noteId: r.noteId,
      distance: r.distance,
      keywordScore,
      finalScore: 0 // Will be set by ranker
    };
  });

  // 5. Ranking Pipeline
  const rankedChunks = scoreAndRankChunks(mappedResults);

  logger.info("Hybrid search execution complete", {
    originalQuery,
    candidateCount: candidateNoteIds.length,
    semanticMatchCount: rawResults.length,
    finalChunkCount: rankedChunks.length,
    durationMs: Date.now() - startTime
  });

  return rankedChunks.slice(0, limit);
}
