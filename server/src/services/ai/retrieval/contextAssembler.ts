import { HybridSearchResult } from "./types";

import { estimateTokens } from "./debug/retrievalMetrics";

export interface ContextAssemblyOptions {
  maxChars?: number;
  topK?: number;
  debugger?: any;
}

/**
 * Assembles the final context string to be sent to the LLM.
 * Implements token-conscious limiting, deduplication, and prioritizes top chunks.
 */
export function assembleContext(
  rankedChunks: HybridSearchResult[],
  options: ContextAssemblyOptions = {}
): string {
  const startTime = Date.now();
  const maxChars = options.maxChars || 3000; // Safe default for context window
  const topK = options.topK || 5;
  const dbg = options.debugger;

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
  const selected = [];
  const dropped = [];
  let droppedTokenCount = 0;

  for (const chunk of uniqueChunks) {
    const addition = context.length > 0 ? `\n\n---\n\n${chunk.content}` : chunk.content;
    
    if (context.length + addition.length > maxChars) {
      dropped.push({ chunkId: chunk.id, reason: "MAX_CHARS_EXCEEDED" });
      droppedTokenCount += estimateTokens(addition.length);
      continue; // Use continue to skip, allowing other chunks to be tracked as dropped
    }
    
    context += addition;
    selected.push({
      chunkId: chunk.id,
      noteId: chunk.noteId,
      score: chunk.finalScore,
      preview: chunk.content.substring(0, 100) + "..."
    });
  }
  
  if (dbg) {
    dbg.setContextAssembly({
      selected,
      dropped,
      tokens: {
        estimatedTokens: estimateTokens(context.length),
        droppedTokenCount,
        contextCharacterCount: context.length
      },
      latencyMs: Date.now() - startTime
    });
  }

  console.log(`[contextAssembler] Selected ${selected.length} chunks, dropped ${dropped.length}. Final context length: ${context.length}`);
  return context;
}
