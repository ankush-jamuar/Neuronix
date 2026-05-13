/**
 * Lightweight token estimation utility for the retrieval pipeline.
 * Designed to avoid heavyweight tokenizer dependencies while providing safe estimates.
 * Future-ready for exact tokenizers (e.g. tiktoken).
 */

export function estimateTokens(characterCount: number): number {
  // Standard English text heuristic: ~4 chars per token.
  return Math.ceil(characterCount / 4);
}

export function estimateTokensForText(text: string): number {
  if (!text) return 0;
  return estimateTokens(text.length);
}
