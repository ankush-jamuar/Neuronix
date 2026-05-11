import { prisma } from "../../lib/prisma";
import Groq from "groq-sdk";
import { analyzeQuery } from "./query-understanding";
import { performHybridSearch, assembleContext } from "./retrieval";
import { logger } from "../../utils/logger";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function askAI(userId: string, question: string) {
  if (!question || question.trim().length === 0) {
    throw new Error("Question is required");
  }

  // 1. Analyze the query to extract intent, metadata, and normalized query
  const analysis = analyzeQuery(question);

  logger.info("Query analysis complete", {
    originalQuery: analysis.originalQuery,
    normalizedQuery: analysis.normalizedQuery,
    intent: analysis.intent,
    confidence: analysis.confidence
  });

  // 2. Generate embedding using the NORMALIZED query
  const { generateEmbedding } = await import("./embeddingService");
  const queryEmbedding = await generateEmbedding(analysis.normalizedQuery);

  // 3. Perform production-safe hybrid retrieval
  const hybridResults = await performHybridSearch({
    userId,
    originalQuery: question,
    normalizedQuery: analysis.normalizedQuery,
    embedding: queryEmbedding,
    metadata: analysis.metadata,
    limit: 10
  });

  if (hybridResults.length === 0) {
    return "I don't have enough information in your notes based on your search.";
  }

  // 4. Token-conscious Context Assembly
  const context = assembleContext(hybridResults, {
    maxChars: 4000,
    topK: 5
  });

  logger.info("Context assembly complete", {
    topChunksRetrieved: hybridResults.length,
    contextLength: context.length
  });

  // 5. Generate final response (Existing flow preserved)
  // For this integration phase, we return the context.
  // The actual LLM calling might be handled by the route or here.
  // The original function returned the context directly, so we preserve that behavior.
  return context;
}
