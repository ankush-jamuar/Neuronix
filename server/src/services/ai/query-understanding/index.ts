import { classifyIntent } from './intentClassifier';
import { extractEntities } from './entityExtractor';
import { normalizeQuery } from './queryNormalizer';
import { QueryAnalysisResult } from './types';

/**
 * The unified Query Understanding Pipeline.
 * Analyzes a raw user query to detect intent, extract metadata filters, 
 * and generate a normalized search query. This must run BEFORE retrieval.
 * 
 * @param query The raw string input from the user
 * @returns QueryAnalysisResult containing structured understanding of the query
 */
export function analyzeQuery(query: string): QueryAnalysisResult {
  if (!query || typeof query !== 'string' || query.trim() === '') {
    throw new Error('Query must be a non-empty string');
  }

  const intentResult = classifyIntent(query);
  const metadata = extractEntities(query);
  const normalizedQuery = normalizeQuery(query);

  return {
    originalQuery: query,
    normalizedQuery,
    intent: intentResult.intent,
    confidence: intentResult.confidence,
    metadata
  };
}

export * from './types';
export * from './intentClassifier';
export * from './entityExtractor';
export * from './queryNormalizer';
