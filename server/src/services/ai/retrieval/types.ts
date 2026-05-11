import { QueryIntent, ExtractedMetadata } from "../query-understanding/types";

export interface RetrievalTrace {
  originalQuery: string;
  normalizedQuery: string;
  detectedIntent: QueryIntent;
  confidence: number;
  appliedFilters: any;
  candidateNoteCount?: number;
  semanticMatchCount?: number;
  keywordMatchCount?: number;
  finalChunkCount?: number;
  rankingSignals?: any;
  durationMs?: number;
}

export interface HybridSearchResult {
  id: string; // DocumentChunk ID
  content: string;
  noteId: string;
  distance: number;
  keywordScore: number;
  finalScore: number;
  signals?: {
    recency?: number;
    importance?: number;
    [key: string]: any;
  };
}

export interface PerformHybridSearchParams {
  userId: string;
  originalQuery: string;
  normalizedQuery: string;
  embedding: number[];
  metadata: ExtractedMetadata;
  limit?: number;
}
