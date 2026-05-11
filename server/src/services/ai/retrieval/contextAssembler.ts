import { HybridSearchResult } from "./types";

export interface ContextAssemblyOptions {
  maxChars?: number;
  topK?: number;
}

/**
 * Assembles the final context string to be sent to the LLM.
 * Implements token-conscious limiting, deduplication, and prioritizes top chunks.
 */
export function assembleContext(
  rankedChunks: HybridSearchResult[],
  options: ContextAssemblyOptions = {}
): string {
  const maxChars = options.maxChars || 3000; // Safe default for context window
  const topK = options.topK || 5;

  // 1. Top-K limiting
  const topChunks = rankedChunks.slice(0, topK);

  // 2. Deduplication by content
  const seenContent = new Set<string>();
  const uniqueChunks: HybridSearchResult[] = [];

  for (const chunk of topChunks) {
    const trimmed = chunk.content.trim();
    if (!seenContent.has(trimmed)) {
      seenContent.add(trimmed);
      uniqueChunks.push(chunk);
    }
  }

  // Future-ready: Sort chronologically here if chunks include a `createdAt` date 
  // and intent is 'time_based_search'.

  // 3. Token-conscious context assembly
  let context = "";
  for (const chunk of uniqueChunks) {
    const addition = context.length > 0 ? `\n\n---\n\n${chunk.content}` : chunk.content;
    
    if (context.length + addition.length > maxChars) {
      break;
    }
    
    context += addition;
  }

  return context;
}
