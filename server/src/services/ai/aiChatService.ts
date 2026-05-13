import { prisma } from "../../lib/prisma";
import Groq from "groq-sdk";
import { analyzeQuery } from "./query-understanding";
import { performHybridSearch, assembleContext } from "./retrieval";
import { logger } from "../../utils/logger";
import { RetrievalDebugger } from "./retrieval/debug/retrievalDebugger";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Main AI chat entry point.
 *
 * @param clerkId  - The Clerk user ID from the authenticated session
 * @param question - The user's natural language question
 */
export async function askAI(clerkId: string, question: string) {
  if (!question || question.trim().length === 0) {
    throw new Error("Question is required");
  }

  // 1. Resolve internal DB user ID from Clerk ID
  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!dbUser) {
    logger.warn("askAI: No DB user found for clerkId", { clerkId });
    return "I couldn't find your user profile. Please try refreshing the page.";
  }

  const internalUserId = dbUser.id;

  const dbg = new RetrievalDebugger(question);
  let stepTime = Date.now();

  // 2. Analyze the query to extract intent, metadata, and normalized query
  const analysis = analyzeQuery(question);
  dbg.setQueryAnalysis(analysis, Date.now() - stepTime);

  console.log("\n[aiChatService] QUERY RECEIVED:", question);
  console.log("[aiChatService] INTERNAL USER ID:", internalUserId);
  console.log("[aiChatService] DETECTED INTENT:", analysis.intent);
  console.log("[aiChatService] METADATA FILTERS:", JSON.stringify(analysis.metadata));

  logger.info("Query analysis complete", {
    originalQuery: analysis.originalQuery,
    normalizedQuery: analysis.normalizedQuery,
    intent: analysis.intent,
    confidence: analysis.confidence,
  });

  // 3. Generate embedding using the NORMALIZED query
  const { generateEmbedding } = await import("./embeddingService");
  const queryEmbedding = await generateEmbedding(analysis.normalizedQuery);
  console.log("[aiChatService] QUERY EMBEDDING LENGTH:", queryEmbedding.length);

  // 4. Perform production-safe hybrid retrieval scoped to the internal user ID
  const hybridResults = await performHybridSearch({
    userId: internalUserId,
    originalQuery: question,
    normalizedQuery: analysis.normalizedQuery,
    embedding: queryEmbedding,
    metadata: analysis.metadata,
    limit: 10,
    debugger: dbg,
  });

  logger.info("Hybrid search complete", {
    resultCount: hybridResults.length,
    internalUserId,
  });

  console.log("[aiChatService] VECTOR SEARCH RESULTS COUNT:", hybridResults.length);

  if (hybridResults.length === 0) {
    console.log("[aiChatService] ⚠ RETRIEVAL RETURNED ZERO RESULTS. TRIGGERING FALLBACK.");
    dbg.finalizeAndLog();
    return "I don't have enough information in your notes to answer that. Try adding more notes or asking a different question.";
  }

  // 5. Token-conscious Context Assembly
  const context = assembleContext(hybridResults, {
    maxChars: 4000,
    topK: 5,
    debugger: dbg,
  });

  console.log("[aiChatService] ASSEMBLED CONTEXT LENGTH:", context.length);
  // console.log("[aiChatService] CONTEXT PREVIEW:", context.substring(0, 500));

  logger.info("Context assembly complete", {
    topChunksRetrieved: hybridResults.length,
    contextLength: context.length,
  });

  // 6. Generate final AI response via Groq
  const systemPrompt = `You are Neuronix, an AI assistant for a personal knowledge management system.
Your job is to answer questions based ONLY on the user's own notes provided below.
If the provided notes don't contain enough information to answer the question, say so honestly.
Do NOT make up information. Always ground your answer in the provided context.

Here are the relevant excerpts from the user's notes:

---
${context}
---`;

  console.log("[aiChatService] CALLING GROQ with model: llama-3.1-8b-instant");

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  });

  console.log("[aiChatService] GROQ RESPONSE RECEIVED");

  const response = completion.choices[0]?.message?.content ?? "I was unable to generate a response. Please try again.";
  console.log("[aiChatService] FINAL AI RESPONSE:", response.substring(0, 100) + "...");

  const finalTrace = dbg.finalizeAndLog();
  // finalTrace can be persisted or emitted in future phases

  return response;
}
