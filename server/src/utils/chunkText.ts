// ─── Text Chunking Utility ────────────────────────────────────────────────────
//
// Splits plain text into overlapping chunks for embedding generation.
// Overlap preserves semantic context at chunk boundaries, which improves
// similarity recall when a relevant sentence spans two chunk boundaries.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Splits text into overlapping character-level chunks.
 *
 * @param text      - Input plain text (should already be stripped of markup)
 * @param chunkSize - Maximum characters per chunk (default: 500)
 * @param overlap   - Characters to overlap between adjacent chunks (default: 50)
 * @returns Array of non-empty text chunks
 *
 * @example
 * chunkText("Hello world ...", 10, 2)
 * // → ["Hello worl", "rld ...", ...]
 */
export function chunkText(text: string, chunkSize = 100, overlap = 20) {
  const words = text.split(" ");
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
  }

  return chunks;
}
