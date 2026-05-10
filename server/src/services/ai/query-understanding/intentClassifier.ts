import { QueryIntent, IntentClassification } from './types';

/**
 * Lightweight rule-based classification to detect the user's intent.
 * This can be extended to an LLM-based classifier in the future.
 */
export function classifyIntent(query: string): IntentClassification {
  const lowerQuery = query.toLowerCase();

  // Keyword mappings for different intents
  const intentRules: Record<QueryIntent, string[]> = {
    time_based_search: ['yesterday', 'last week', 'last month', 'today', 'last year', 'recent', 'recently', 'this week'],
    revision_query: ['revise', 'revising', 'study', 'learned', 'review', 'test me', 'quiz', 'recap'],
    note_lookup: ['notes about', 'show notes', 'find notes', 'where are my notes', 'my notes on', 'discussion'],
    summary_request: ['summarize', 'summary', 'tldr', 'tl;dr', 'give me an overview', 'brief', 'short version'],
    semantic_search: [], // Default fallback
    unknown: []
  };

  let bestIntent: QueryIntent = 'semantic_search';
  let maxScore = 0;

  for (const [intent, keywords] of Object.entries(intentRules)) {
    if (intent === 'semantic_search' || intent === 'unknown') continue;

    let score = 0;
    for (const keyword of keywords) {
      // Check if keyword is an exact word match or phrase match
      if (lowerQuery.includes(keyword)) {
        score += keyword.split(' ').length; // Longer matching phrases get a higher score
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestIntent = intent as QueryIntent;
    }
  }

  // Calculate a pseudo-confidence score based on matching keywords
  let confidence = 0.5; // Default base confidence for fallback
  if (maxScore > 0) {
    confidence = Math.min(0.7 + (maxScore * 0.05), 0.95); // Cap confidence at 0.95
  }

  return {
    intent: bestIntent,
    confidence: Number(confidence.toFixed(2))
  };
}
