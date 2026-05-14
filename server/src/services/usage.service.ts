import { prisma } from "../lib/prisma";

/**
 * Logs AI usage for a user.
 * Falls back to a manual find-then-upsert if the unique constraint migration hasn't been applied yet.
 */
export const logUsage = async (userId: string, data: { tokens?: number; queries?: number }) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Try optimized upsert first
    try {
      await prisma.usage.upsert({
        where: {
          userId_date: {
            userId,
            date: today
          }
        },
        update: {
          tokens: { increment: data.tokens || 0 },
          queries: { increment: data.queries || 1 }
        },
        create: {
          userId,
          date: today,
          tokens: data.tokens || 0,
          queries: data.queries || 1
        }
      });
    } catch (upsertError) {
      // Fallback: manually check and update/create (handles missing unique constraint)
      const existing = await prisma.usage.findFirst({
        where: { userId, date: today }
      });

      if (existing) {
        await prisma.usage.update({
          where: { id: existing.id },
          data: {
            tokens: { increment: data.tokens || 0 },
            queries: { increment: data.queries || 1 }
          }
        });
      } else {
        await prisma.usage.create({
          data: {
            userId,
            date: today,
            tokens: data.tokens || 0,
            queries: data.queries || 1
          }
        });
      }
    }
  } catch (error) {
    console.error("[UsageService] Critical failure logging usage:", error);
  }
};
