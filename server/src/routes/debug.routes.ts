import { Router, Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * POST /api/debug-retrieval
 * Development-only endpoint that runs the full retrieval pipeline
 * and returns the complete RetrievalTrace for observability.
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  if (process.env.NODE_ENV !== 'development') {
    res.status(403).json({ error: "Forbidden: Development only" });
    return;
  }

  try {
    const auth = getAuth(req);
    const clerkId = auth?.userId;

    if (!clerkId) {
      res.status(401).json({ error: 'Unauthorized — Clerk session required' });
      return;
    }

    // Resolve internal DB user ID from Clerk ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!dbUser) {
      res.status(404).json({ error: 'User not found in DB. Try making an API call first to trigger lazy upsert.' });
      return;
    }

    const internalUserId = dbUser.id;
    const { query } = req.body;

    if (!query) {
      res.status(400).json({ error: "Query is required" });
      return;
    }

    const { analyzeQuery } = await import('../services/ai/query-understanding');
    const { performHybridSearch, assembleContext } = await import('../services/ai/retrieval');
    const { generateEmbedding } = await import('../services/ai/embeddingService');
    const { RetrievalDebugger } = await import('../services/ai/retrieval/debug/retrievalDebugger');

    const dbg = new RetrievalDebugger(query);
    let stepTime = Date.now();

    const analysis = analyzeQuery(query);
    dbg.setQueryAnalysis(analysis, Date.now() - stepTime);
    stepTime = Date.now();

    const queryEmbedding = await generateEmbedding(analysis.normalizedQuery);

    const hybridResults = await performHybridSearch({
      userId: internalUserId,
      originalQuery: query,
      normalizedQuery: analysis.normalizedQuery,
      embedding: queryEmbedding,
      metadata: analysis.metadata,
      limit: 10,
      debugger: dbg,
    });

    const context = assembleContext(hybridResults, {
      maxChars: 4000,
      topK: 5,
      debugger: dbg,
    });

    const finalTrace = dbg.finalizeAndLog();

    res.json({
      success: true,
      trace: finalTrace,
      chunksRetrieved: hybridResults.length,
      contextLength: context.length,
      contextPreview: context.substring(0, 500),
    });
  } catch (error) {
    console.error('[DebugRetrieval] Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : "Unknown",
    });
  }
});

export default router;
