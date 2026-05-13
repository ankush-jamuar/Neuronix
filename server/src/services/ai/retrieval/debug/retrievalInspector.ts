import { RetrievalTrace } from "../types";

/**
 * Diagnostic utility to flag anomalies in a retrieval trace.
 * Detects edge cases that could harm retrieval quality or performance.
 */
export function detectRetrievalAnomalies(trace: Partial<RetrievalTrace>): string[] {
  const anomalies: string[] = [];

  // 1. Confidence checks
  if (trace.confidenceScore !== undefined && trace.confidenceScore < 0.4) {
    anomalies.push("LOW_INTENT_CONFIDENCE: Query understanding confidence is below 0.4.");
  }

  // 2. Candidate set warnings
  if (trace.candidateCounts?.prismaCandidates !== undefined) {
    if (trace.candidateCounts.prismaCandidates === 0 && trace.prismaFilters && Object.keys(trace.prismaFilters).length > 2) {
      anomalies.push("OVER_FILTERED: No candidates found. Metadata filters might be too restrictive.");
    }
    if (trace.candidateCounts.prismaCandidates > 800) {
      anomalies.push("OVERSIZED_CANDIDATE_SET: Prisma returned a massive candidate pool (>800).");
    }
  }

  // 3. Retrieval failures
  if (trace.candidateCounts?.finalChunks === 0) {
    anomalies.push("EMPTY_RETRIEVAL: Zero chunks selected for final context assembly.");
  }

  // 4. Token truncation warnings
  if (trace.tokenMetrics?.droppedTokenCount !== undefined && trace.tokenMetrics.droppedTokenCount > 500) {
    anomalies.push("EXCESSIVE_TRUNCATION: Large volume of tokens dropped during context assembly.");
  }

  // 5. Ranking quality
  if (trace.rankingBreakdown && trace.rankingBreakdown.length > 0) {
    const topChunk = trace.rankingBreakdown[0];
    if (topChunk.semanticScore < 0.2 && topChunk.keywordScore === 0) {
      anomalies.push("WEAK_TOP_MATCH: The highest ranked chunk has very low semantic and keyword relevance.");
    }
  }

  return anomalies;
}
