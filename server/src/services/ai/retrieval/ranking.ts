import { HybridSearchResult } from "./types";

export interface RankingWeights {
  semantic: number;
  keyword: number;
  recency: number;
  importance: number;
  reinforcement: number;
}

const DEFAULT_WEIGHTS: RankingWeights = {
  semantic: 0.55,
  keyword: 0.10,
  recency: 0.15,
  importance: 0.10,
  reinforcement: 0.10
};

/**
 * Modular ranking pipeline.
 * Combines semantic, keyword, and future intelligent signals into a unified score.
 */
export function scoreAndRankChunks(
  chunks: HybridSearchResult[],
  weights: RankingWeights = DEFAULT_WEIGHTS
): HybridSearchResult[] {
  const scored = chunks.map(chunk => {
    // pgvector <=> operator returns cosine distance (0 is exact match, 2 is completely opposite).
    // Cosine similarity is 1 - distance.
    const similarity = Math.max(0, 1 - chunk.distance);
    
    // Keyword score normalization (cap at 1.0)
    const normalizedKeywordScore = Math.min(chunk.keywordScore * 0.15, 1.0);

    const recencyBoost = chunk.signals?.recency || 0;
    const importanceScore = chunk.signals?.importance || 0;
    const reinforcementScore = chunk.signals?.reinforcement || 0;

    const finalScore = 
      (similarity * weights.semantic) +
      (normalizedKeywordScore * weights.keyword) +
      (recencyBoost * weights.recency) +
      (importanceScore * weights.importance) +
      (reinforcementScore * weights.reinforcement);

    return {
      ...chunk,
      finalScore
    };
  });

  // Sort descending by final score
  return scored.sort((a, b) => b.finalScore - a.finalScore);
}
