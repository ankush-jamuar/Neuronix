import { QueryIntent, ExtractedMetadata } from "../query-understanding/types";

export interface RetrievalTrace {
  originalQuery: string;
  normalizedQuery: string;
  
  detectedIntent: QueryIntent;
  confidenceScore: number;
  
  extractedMetadata: {
    technologies: string[];
    folders: string[];
    topics: string[];
    dateRange?: any;
    noteReferences?: string[];
  };
  
  prismaFilters: any;
  
  candidateCounts: {
    prismaCandidates: number;
    semanticMatches: number;
    keywordMatches: number;
    finalChunks: number;
  };
  
  rankingBreakdown: {
    chunkId: string;
    semanticScore: number;
    keywordScore: number;
    recencyBoost: number;
    importanceScore: number;
    reinforcementScore: number;
    finalScore: number;
    contributingSignals: string[];
    retrievalCount?: number;
    lastAccessedAt?: Date | string | null;
    isPinned?: boolean;
  }[];
  
  selectedChunks: {
    chunkId: string;
    noteId: string;
    score: number;
    preview: string;
  }[];
  
  droppedChunks: {
    chunkId: string;
    reason: string;
  }[];
  
  tokenMetrics: {
    estimatedTokens: number;
    droppedTokenCount: number;
    contextCharacterCount: number;
  };
  
  latencyMetrics: {
    queryAnalysisMs: number;
    prismaFilteringMs: number;
    vectorSearchMs: number;
    rankingMs: number;
    contextAssemblyMs: number;
    totalMs: number;
  };
  
  anomalies?: string[];
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
  debugger?: any; // We'll type this loosely here or import the type if no circular dependency
}
