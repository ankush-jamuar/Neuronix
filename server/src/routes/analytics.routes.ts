import { Router } from "express";
import { prisma } from "../lib/prisma";
import { calculateDecayFactor } from "../services/ai/retrieval/memoryAnalytics";

import { getAuth } from "@clerk/express";

const router = Router();

router.get("/memory-health", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    });
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    const notes = await prisma.note.findMany({
      where: { userId: dbUser.id, isDeleted: false },
      select: {
        id: true,
        title: true,
        retrievalCount: true,
        reinforcementScore: true,
        isPinned: true,
        lastAccessedAt: true,
        updatedAt: true
      },
      orderBy: { retrievalCount: 'desc' },
      take: 50
    });

    const processedNotes = notes.map(n => ({
      ...n,
      decayedScore: (n.reinforcementScore || 0) * calculateDecayFactor(n.lastAccessedAt),
      status: (n.retrievalCount > 10) ? 'hot' : (n.retrievalCount > 0) ? 'active' : 'stale'
    }));

    res.json({
      topRetrieved: processedNotes.slice(0, 5),
      pinned: processedNotes.filter(n => n.isPinned),
      stale: processedNotes.filter(n => !n.isPinned && (n.retrievalCount === 0 || calculateDecayFactor(n.lastAccessedAt) < 0.7)).slice(0, 10),
      summary: {
        totalMemories: notes.length,
        activeMemories: processedNotes.filter(n => n.retrievalCount > 0).length,
        pinnedCount: processedNotes.filter(n => n.isPinned).length
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

export default router;
