/**
 * Normalizes user queries for the retrieval pipeline.
 * Removes common stop words, punctuation, and structures the query optimally for BM25 and vector search.
 */
export function normalizeQuery(query: string): string {
  let normalized = query.toLowerCase();

  // 1. Remove common punctuation (keep hyphens and underscores for technical terms)
  normalized = normalized.replace(/[?.,!;:'"]/g, ' ');

  // 2. Remove stop words (noise words) to optimize retrieval focus
  const stopWords = new Set([
    'what', 'who', 'where', 'when', 'why', 'how', 'is', 'are', 'was', 'were',
    'did', 'do', 'does', 'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'about', 'can', 'you', 'i', 'me', 'my', 'we', 'our', 'show', 'find', 
    'give', 'tell', 'me', 'some', 'any', 'all', 'from'
  ]);

  const words = normalized.split(/\s+/).filter(word => word.length > 0);
  const filteredWords = words.filter(word => !stopWords.has(word));

  // 3. Reconstruct query
  let finalQuery = filteredWords.join(' ');

  // 4. Fallback: If stripping stop words removed everything (e.g., "what is it"), 
  // revert to the original words without punctuation.
  if (finalQuery.trim() === '') {
    finalQuery = words.join(' ');
  }

  // Ensure query is compact and ready for hybrid search
  return finalQuery.trim();
}
