import { prisma } from "../../lib/prisma";
import Groq from "groq-sdk";
import { analyzeQuery } from "./query-understanding";
import { performHybridSearch, assembleContext } from "./retrieval";
import { logger } from "../../utils/logger";
import { RetrievalDebugger } from "./retrieval/debug/retrievalDebugger";
import { IntentRouter } from "./IntentRouter";
import { generateEmbedding } from "./embeddingService";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Main AI chat entry point with unified persistence and runtime optimization.
 */
export async function askAI(params: {
  userId: string;
  question: string;
  sessionId?: string;
  mode?: 'memory' | 'study';
}) {
  const { userId, question, sessionId, mode = 'memory' } = params;

  if (!question || question.trim().length === 0) {
    throw new Error("Question is required");
  }

  const dbg = new RetrievalDebugger(question);
  let overallStartTime = Date.now();
  let stepTime = overallStartTime;

  try {
    // 1. Query Analysis
    const analysis = analyzeQuery(question);
    dbg.setQueryAnalysis(analysis, Date.now() - stepTime);
    stepTime = Date.now();

    // 2. Intent-Aware Routing
    const routing = IntentRouter.route(analysis, mode);
    logger.info("Routing decision made", { strategy: routing.strategy, reason: routing.reason });

    let context = "";
    let sources: any = null;

    if (routing.strategy === 'RAG') {
      // 3. Generate embedding
      const queryEmbedding = await generateEmbedding(analysis.normalizedQuery);
      dbg.setLatency("embeddingGenerationMs", Date.now() - stepTime);
      stepTime = Date.now();

      // 4. Hybrid Search
      const hybridResults = await performHybridSearch({
        userId,
        originalQuery: question,
        normalizedQuery: analysis.normalizedQuery,
        embedding: queryEmbedding,
        metadata: analysis.metadata,
        limit: 10,
        debugger: dbg,
      });
      // performHybridSearch sets its own latency in debugger

      // 5. Context Assembly
      context = assembleContext(hybridResults, {
        maxChars: 4000,
        topK: 5,
        debugger: dbg,
      });
      sources = hybridResults.slice(0, 5).map(r => ({
        noteId: r.noteId,
        content: r.content.substring(0, 200),
        score: r.finalScore
      }));
    } else if (routing.strategy === 'STUDY_FALLBACK') {
        context = "NOTE: You are in Study Mode. Provide general educational guidance. Only reference personal notes if explicitly asked.";
    }

    // 6. LLM Generation
    const systemPrompt = routing.strategy === 'GREETING' 
      ? "You are Neuronix, a helpful AI assistant. The user is greeting you or making casual conversation. Be brief, friendly, and professional. Mention that you can help them explore their knowledge base if they have specific questions."
      : `You are Neuronix, an AI assistant for a personal knowledge management system.
Your job is to answer questions based on the provided context.
${mode === 'study' ? 'You are currently in STUDY MODE. Prioritize educational clarity and structured explanations.' : 'Ground your answers in the user\'s personal notes when available.'}

Context Excerpts:
---
${context}
---`;

    stepTime = Date.now();
    const completionPromise = groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      temperature: mode === 'study' ? 0.5 : 0.3,
      max_tokens: 1024,
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("AI generation timed out")), 25000)
    );

    const completion = await Promise.race([completionPromise, timeoutPromise]) as any;

    const llmInferenceMs = Date.now() - stepTime;
    dbg.setLatency("llmInferenceMs", llmInferenceMs);

    const finalAnswer = completion.choices[0]?.message?.content ?? "I was unable to generate a response.";

    // 7. Unified Persistence (Transaction-safe)
    let effectiveSessionId = sessionId;
    
    const trace = dbg.finalizeAndLog();
    const latencyData = trace.latencyMetrics;

    const result = await prisma.$transaction(async (tx) => {
      // Ensure session exists or create one
      if (!effectiveSessionId) {
        const session = await tx.chatSession.create({
          data: {
            userId,
            title: question.slice(0, 50) + (question.length > 50 ? "..." : "")
          }
        });
        effectiveSessionId = session.id;
      } else {
        // Update session timestamp
        await tx.chatSession.update({
          where: { id: effectiveSessionId },
          data: { updatedAt: new Date() }
        });
      }

      // Persist User Message
      const userMsg = await tx.chatMessage.create({
        data: {
          userId,
          chatSessionId: effectiveSessionId,
          role: 'USER',
          content: question,
          status: 'COMPLETED'
        }
      });

      // Persist Assistant Message
      const assistantMsg = await tx.chatMessage.create({
        data: {
          userId,
          chatSessionId: effectiveSessionId,
          role: 'ASSISTANT',
          content: finalAnswer,
          sources: {
            citations: sources,
            latency: latencyData,
            routing: routing,
            traceId: userMsg.id // Link for future debugging
          },
          status: 'COMPLETED'
        }
      });

      return {
        sessionId: effectiveSessionId,
        userMessageId: userMsg.id,
        assistantMessageId: assistantMsg.id,
        answer: finalAnswer,
        sources: sources,
        latency: latencyData
      };
    });

    return result;

  } catch (error: any) {
    console.error("[aiChatService] Pipeline Failure:", error);
    logger.error("AI Pipeline crashed", { error: error.message, stack: error.stack });
    
    // Attempt to persist error state if we have a session
    if (sessionId) {
        await prisma.chatMessage.create({
            data: {
                userId,
                chatSessionId: sessionId,
                role: 'ASSISTANT',
                content: "I encountered a synchronization error while processing your request.",
                status: 'FAILED'
            }
        }).catch(e => console.error("Double fault during error persistence:", e));
    }

    throw error;
  }
}
