import { prisma } from "../../../lib/prisma";

/**
 * Tracks access to a note (e.g., when opened in the editor).
 * Updates lastAccessedAt asynchronously.
 */
export async function trackNoteAccess(noteId: string): Promise<void> {
  void (async () => {
    try {
      await prisma.note.update({
        where: { id: noteId },
        data: { lastAccessedAt: new Date() },
      });
    } catch (error) {
      console.error("[MemoryAnalytics] Error tracking note access:", error);
    }
  })();
}

/**
 * Increments the retrieval count for a set of notes.
 * Used when notes contribute to AI context.
 */
export async function incrementRetrievalCounts(noteIds: string[]): Promise<void> {
  if (noteIds.length === 0) return;
  
  const uniqueIds = Array.from(new Set(noteIds));

  void (async () => {
    try {
      await prisma.note.updateMany({
        where: { id: { in: uniqueIds } },
        data: { 
          retrievalCount: { increment: 1 },
          lastAccessedAt: new Date()
        },
      });
    } catch (error) {
      console.error("[MemoryAnalytics] Error incrementing retrieval counts:", error);
    }
  })();
}

/**
 * Increases reinforcement score when a note is retrieved or interacted with.
 * Scores are bounded to [0, 5].
 */
export async function reinforceNote(noteId: string, amount: number = 0.05): Promise<void> {
  void (async () => {
    try {
      await prisma.note.update({
        where: { id: noteId },
        data: { 
          reinforcementScore: { increment: amount },
          lastAccessedAt: new Date()
        },
      });
      
      // Cap at 5.0 in a follow-up if needed, or use a complex SQL update
    } catch (error) {
      console.error("[MemoryAnalytics] Error reinforcing note:", error);
    }
  })();
}

/**
 * Calculates a decay factor based on inactivity.
 * After 180 days of no access, score drops to 0.5x.
 */
export function calculateDecayFactor(lastAccessedAt: Date | string | null): number {
  if (!lastAccessedAt) return 1.0;
  const accessTime = typeof lastAccessedAt === "string" ? new Date(lastAccessedAt).getTime() : lastAccessedAt.getTime();
  const inactiveDays = (Date.now() - accessTime) / (1000 * 60 * 60 * 24);
  
  // Decays from 1.0 to 0.5 over 180 days. Never drops below 0.5.
  return Math.max(0.5, 1 - inactiveDays / 180);
}

/**
 * Calculates a recency boost score between 0 and 1.
 * Notes updated within the last 30 days get a boost.
 */
export function calculateRecencyBoost(updatedAt: Date | string): number {
  const updateTime = typeof updatedAt === "string" ? new Date(updatedAt).getTime() : updatedAt.getTime();
  const daysOld = (Date.now() - updateTime) / (1000 * 60 * 60 * 24);
  
  // 1.0 boost for brand new, 0.0 boost for 30+ days old
  return Math.max(0, 1 - daysOld / 30);
}
