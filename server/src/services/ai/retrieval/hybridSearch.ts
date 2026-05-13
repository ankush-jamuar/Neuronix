import { prisma } from "../../../lib/prisma";
import { Prisma } from "@prisma/client";
import { buildMetadataFilters } from "./filterBuilder";
import { scoreAndRankChunks } from "./ranking";
import { PerformHybridSearchParams, HybridSearchResult } from "./types";
import { logger } from "../../../utils/logger";
import { calculateRecencyBoost, incrementRetrievalCounts, calculateDecayFactor, reinforceNote } from "./memoryAnalytics";

/**
 * Executes a hybrid retrieval pipeline.
 * Steps:
 * 1. Filter candidates via Prisma (Metadata)
 * 2. Retrieve top-k semantic matches via pgvector (Semantic)
 * 3. Score keyword relevance (Keyword)
 * 4. Apply Ranking Pipeline
 */
export async function performHybridSearch(params: PerformHybridSearchParams): Promise<HybridSearchResult[]> {
  const { userId, originalQuery, normalizedQuery, embedding, metadata, limit = 10, debugger: dbg } = params;

  const startTime = Date.now();
  let stepTime = startTime;

  console.log("\n========== [HybridSearch] START ==========");
  console.log("[HybridSearch] userId:", userId);
  console.log("[HybridSearch] query:", originalQuery);
  console.log("[HybridSearch] embedding length:", embedding?.length ?? "MISSING");

  // 1. Build strict Prisma filters
  const filters = buildMetadataFilters(userId, metadata);
  if (dbg) dbg.setFilters(filters);

  console.log("[HybridSearch] Prisma filters:", JSON.stringify(filters));

  // 2. Fetch candidate Note IDs scoped strictly to this user
  const candidateNotes = await prisma.note.findMany({
    where: filters,
    select: { id: true },
    take: 1000,
  });

  const candidateNoteIds = candidateNotes.map(n => n.id);

  console.log("[HybridSearch] Candidate notes found:", candidateNoteIds.length);
  if (candidateNoteIds.length > 0) {
    console.log("[HybridSearch] First candidate IDs:", candidateNoteIds.slice(0, 3));
  }

  if (dbg) {
    const filterMs = Date.now() - stepTime;
    dbg.setLatency("prismaFilteringMs", filterMs);
    stepTime = Date.now();
  }

  // Early exit: no candidate notes for this user
  if (candidateNoteIds.length === 0) {
    console.log("[HybridSearch] ⚠ ZERO candidates with metadata filters. Falling back to all user notes.");
    
    // Try again with just basic user filters
    const fallbackNotes = await prisma.note.findMany({
      where: { userId, isDeleted: false },
      select: { id: true },
      take: 1000
    });
    
    candidateNoteIds.push(...fallbackNotes.map(n => n.id));
    
    if (candidateNoteIds.length === 0) {
      console.log("[HybridSearch] ⚠ ZERO total notes found for this user. Nothing to retrieve.");
      logger.info("Hybrid search yielded no candidates even after fallback", { 
        userId, 
        appliedFilters: filters 
      });
      if (dbg) dbg.setCandidateCounts({ prismaCandidates: 0, semanticMatches: 0, keywordMatches: 0 });
      return [];
    }
    
    console.log(`[HybridSearch] Fallback successful: found ${candidateNoteIds.length} total user notes.`);
  }

  // 3. pgvector Semantic Search — use Prisma.sql + Prisma.join for safe array binding
  const vectorLimit = limit * 2;
  const embeddingStr = JSON.stringify(embedding);

  // ─── CRITICAL FIX ────────────────────────────────────────────────────────────
  // Prisma $queryRaw tagged templates do NOT cast JS string[] to PostgreSQL text[].
  // We must build the array literal explicitly with Prisma.sql + Prisma.join.
  // ─────────────────────────────────────────────────────────────────────────────
  let rawResults: any[] = [];

  try {
    rawResults = await prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT
          dc.id,
          dc.content,
          dc."noteId",
          (dc.embedding <=> ${embeddingStr}::vector)::float8 AS distance,
          n."updatedAt" as "noteUpdatedAt",
          n."retrievalCount" as "noteRetrievalCount",
          n."lastAccessedAt" as "noteLastAccessedAt",
          n."reinforcementScore" as "noteReinforcementScore",
          n."isPinned" as "noteIsPinned"
        FROM "DocumentChunk" dc
        JOIN "Note" n ON dc."noteId" = n.id
        WHERE dc."noteId" IN (${Prisma.join(candidateNoteIds)})
        ORDER BY dc.embedding <=> ${embeddingStr}::vector ASC
        LIMIT ${vectorLimit}
      `
    );
    console.log("[HybridSearch] RAW VECTOR RESULTS:", JSON.stringify(rawResults.map(r => ({ id: r.id, dist: r.distance }))));
    console.log("[HybridSearch] ✅ pgvector query returned:", rawResults.length, "results");
    if (rawResults.length > 0) {
      console.log("[HybridSearch] Top result — distance:", rawResults[0]?.distance, "| content preview:", String(rawResults[0]?.content).substring(0, 80));
    }
  } catch (err: any) {
    console.error("[HybridSearch] ❌ pgvector query FAILED:", err?.message);
    logger.error("pgvector query failed", { error: err?.message });
    throw err;
  }

  if (dbg) {
    const vectorMs = Date.now() - stepTime;
    dbg.setLatency("vectorSearchMs", vectorMs);
    stepTime = Date.now();
  }

  // 4. Keyword relevance scoring
  const keywords = normalizedQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  let keywordMatches = 0;

  const mappedResults: HybridSearchResult[] = rawResults.map(r => {
    const contentLower = (r.content || "").toLowerCase();
    let keywordScore = 0;

    for (const kw of keywords) {
      if (contentLower.includes(kw)) {
        keywordScore++;
      }
    }

    if (keywordScore > 0) keywordMatches++;

    return {
      id: r.id,
      content: r.content,
      noteId: r.noteId,
      distance: parseFloat(r.distance) || 1.0,
      keywordScore,
      finalScore: 0,
      signals: {
        recency: calculateRecencyBoost(r.noteUpdatedAt),
        retrievalCount: r.noteRetrievalCount,
        lastAccessedAt: r.noteLastAccessedAt,
        reinforcement: (r.noteReinforcementScore || 0) * calculateDecayFactor(r.noteLastAccessedAt),
        importance: r.noteIsPinned ? 1.0 : 0.0,
        isPinned: r.noteIsPinned
      }
    };
  });

  // 5. Ranking Pipeline
  const rankedChunks = scoreAndRankChunks(mappedResults);

  console.log("[HybridSearch] After ranking:", rankedChunks.length, "chunks");
  if (rankedChunks.length > 0) {
    console.log("[HybridSearch] Top chunk finalScore:", rankedChunks[0]?.finalScore?.toFixed(4), "| distance:", rankedChunks[0]?.distance?.toFixed(4));
  }

  if (dbg) {
    const rankMs = Date.now() - stepTime;
    dbg.setLatency("rankingMs", rankMs);
    dbg.setCandidateCounts({
      prismaCandidates: candidateNoteIds.length,
      semanticMatches: rawResults.length,
      keywordMatches,
    });

    const breakdown = rankedChunks.map(c => {
      const signals = [];
      if (1 - c.distance > 0.5) signals.push("strong_semantic_match");
      if (c.keywordScore > 0) signals.push("keyword_match");
      if ((c.signals?.recency || 0) > 0.7) signals.push("recency_boost");
      if (c.signals?.isPinned) signals.push("pinned_priority");
      if ((c.signals?.reinforcement || 0) > 1.0) signals.push("reinforced_memory");

      return {
        chunkId: c.id,
        semanticScore: 1 - c.distance,
        keywordScore: c.keywordScore,
        recencyBoost: c.signals?.recency || 0,
        importanceScore: c.signals?.importance || 0,
        reinforcementScore: c.signals?.reinforcement || 0,
        finalScore: c.finalScore,
        contributingSignals: signals,
        retrievalCount: c.signals?.retrievalCount,
        lastAccessedAt: c.signals?.lastAccessedAt,
        isPinned: c.signals?.isPinned
      };
    });
    dbg.addRankingData(breakdown);
  }

  logger.info("Hybrid search execution complete", {
    originalQuery,
    candidateCount: candidateNoteIds.length,
    semanticMatchCount: rawResults.length,
    finalChunkCount: rankedChunks.length,
    durationMs: Date.now() - startTime,
  });

  const finalResults = rankedChunks.slice(0, limit);

  // 6. Memory Intelligence: Increment retrieval counts and reinforce contributors
  const retrievedNoteIds = finalResults.map(c => c.noteId);
  void incrementRetrievalCounts(retrievedNoteIds);
  
  // Apply reinforcement to winners
  for (const noteId of Array.from(new Set(retrievedNoteIds))) {
    void reinforceNote(noteId);
  }

  console.log("[HybridSearch] ✅ Returning", finalResults.length, "ranked chunks");
  console.log("========== [HybridSearch] END ==========\n");

  return finalResults;
}
