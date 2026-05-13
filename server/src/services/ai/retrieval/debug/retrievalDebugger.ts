import { RetrievalTrace } from "../types";
import { logger } from "../../../../utils/logger";
import { detectRetrievalAnomalies } from "./retrievalInspector";

/**
 * A builder-pattern class to safely collect and format retrieval traces
 * across the asynchronous pipeline stages without cluttering business logic.
 */
export class RetrievalDebugger {
  private trace: Partial<RetrievalTrace> = {
    latencyMetrics: {
      queryAnalysisMs: 0,
      prismaFilteringMs: 0,
      vectorSearchMs: 0,
      rankingMs: 0,
      contextAssemblyMs: 0,
      totalMs: 0
    },
    candidateCounts: {
      prismaCandidates: 0,
      semanticMatches: 0,
      keywordMatches: 0,
      finalChunks: 0
    },
    rankingBreakdown: [],
    selectedChunks: [],
    droppedChunks: [],
    tokenMetrics: {
      estimatedTokens: 0,
      droppedTokenCount: 0,
      contextCharacterCount: 0
    }
  };

  private startTime: number;

  constructor(originalQuery: string) {
    this.trace.originalQuery = originalQuery;
    this.startTime = Date.now();
  }

  setQueryAnalysis(analysis: any, latencyMs: number) {
    this.trace.normalizedQuery = analysis.normalizedQuery;
    this.trace.detectedIntent = analysis.intent;
    this.trace.confidenceScore = analysis.confidence;
    this.trace.extractedMetadata = {
      technologies: analysis.metadata?.technologies || [],
      folders: analysis.metadata?.folders || [],
      topics: analysis.metadata?.topics || [],
      dateRange: analysis.metadata?.dateRange,
      noteReferences: analysis.metadata?.noteReferences || []
    };
    if (this.trace.latencyMetrics) {
      this.trace.latencyMetrics.queryAnalysisMs = latencyMs;
    }
  }

  setFilters(filters: any) {
    this.trace.prismaFilters = filters;
  }

  setCandidateCounts(counts: { prismaCandidates: number; semanticMatches: number; keywordMatches: number }) {
    if (this.trace.candidateCounts) {
      this.trace.candidateCounts.prismaCandidates = counts.prismaCandidates;
      this.trace.candidateCounts.semanticMatches = counts.semanticMatches;
      this.trace.candidateCounts.keywordMatches = counts.keywordMatches;
    }
  }

  addRankingData(breakdown: any[]) {
    this.trace.rankingBreakdown = breakdown;
  }

  setLatency(stage: keyof RetrievalTrace['latencyMetrics'], ms: number) {
    if (this.trace.latencyMetrics) {
      this.trace.latencyMetrics[stage] = ms;
    }
  }

  setContextAssembly(data: { selected: any[]; dropped: any[]; tokens: any; latencyMs: number }) {
    this.trace.selectedChunks = data.selected;
    this.trace.droppedChunks = data.dropped;
    this.trace.tokenMetrics = data.tokens;
    
    if (this.trace.candidateCounts) {
      this.trace.candidateCounts.finalChunks = data.selected.length;
    }
    if (this.trace.latencyMetrics) {
      this.trace.latencyMetrics.contextAssemblyMs = data.latencyMs;
    }
  }

  finalizeAndLog(): RetrievalTrace {
    if (this.trace.latencyMetrics) {
      this.trace.latencyMetrics.totalMs = Date.now() - this.startTime;
    }
    
    this.trace.anomalies = detectRetrievalAnomalies(this.trace);

    const completeTrace = this.trace as RetrievalTrace;

    logger.info("RetrievalTrace Generated", {
  intent: completeTrace.detectedIntent,
  finalChunks: completeTrace.candidateCounts.finalChunks,
  totalLatency: completeTrace.latencyMetrics.totalMs,
  anomaliesCount: completeTrace.anomalies?.length ?? 0
});

if ((completeTrace.anomalies?.length ?? 0) > 0) {
  logger.warn("Retrieval Anomalies Detected", {
    anomalies: completeTrace.anomalies ?? []
  });
}

    return completeTrace;
  }
}
