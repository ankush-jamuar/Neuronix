import { QueryAnalysisResult, QueryIntent } from "./query-understanding/types";
import { logger } from "../../utils/logger";

export type RoutingDecision = {
  strategy: 'RAG' | 'DIRECT' | 'STUDY_FALLBACK' | 'GREETING';
  reason: string;
};

/**
 * Modular router to decide the AI response strategy based on query analysis.
 * This avoids monolithic if/else chains and allows for future strategy expansion.
 */
export class IntentRouter {
  /**
   * Routes the query to the appropriate processing strategy.
   */
  static route(analysis: QueryAnalysisResult, mode: 'memory' | 'study' = 'memory'): RoutingDecision {
    const { intent, confidence } = analysis;

    logger.info("IntentRouter making decision", { intent, confidence, mode });

    // 1. Handle Greetings & Casual Chat (No Retrieval)
    if (intent === 'greeting' || (intent === 'casual' && confidence > 0.6)) {
      return {
        strategy: 'GREETING',
        reason: "Query identified as greeting or casual interaction; skipping retrieval."
      };
    }

    // 2. Handle Study Mode Routing
    if (mode === 'study') {
      // Study mode typically bypasses personal memory unless explicitly requested
      if (intent !== 'note_lookup' && intent !== 'revision_query') {
        return {
          strategy: 'STUDY_FALLBACK',
          reason: "Study mode active; using global educational strategy."
        };
      }
    }

    // 3. Special handling for low-confidence or general queries
    if (intent === 'unknown' || (intent === 'semantic_search' && confidence < 0.3)) {
      // If we're not sure, we still try RAG but we might want a different fallback later
      return {
        strategy: 'RAG',
        reason: "Uncertain intent; falling back to RAG for safety."
      };
    }

    // 4. Default Strategy: Full RAG
    return {
      strategy: 'RAG',
      reason: `Defaulting to RAG for intent: ${intent}`
    };
  }
}
