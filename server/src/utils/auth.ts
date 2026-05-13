import { Request } from 'express';
import { getAuth, clerkClient } from '@clerk/express';
import { prisma } from '../lib/prisma';

/**
 * Resolves the internal PostgreSQL user ID from an authenticated Clerk request.
 *
 * Implements a lazy-upsert strategy: if the Clerk user has never been synced
 * into the local DB (e.g. in development where webhooks cannot reach localhost),
 * we fetch the user profile from Clerk's API and upsert them on the spot.
 *
 * This ensures the system works seamlessly in:
 *   - Local development (no public URL → webhooks don't fire)
 *   - Production (webhooks fire, user already exists → upsert is a no-op)
 */
export const getInternalUserId = async (req: Request): Promise<string | null> => {
  const auth = getAuth(req);

  if (!auth || !auth.userId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Auth] Missing auth or auth.userId from getAuth()');
    }
    return null;
  }

  const clerkId = auth.userId;

  // Fast path: user already exists in DB
  const existingUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (existingUser) {
    return existingUser.id;
  }

  // Lazy-upsert path: user authenticated via Clerk but not yet in DB.
  // Fetch their profile from Clerk and create the DB record.
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Auth] No DB record for clerkId=${clerkId}. Fetching from Clerk and upserting...`);
  }

  try {
    const clerkUser = await clerkClient.users.getUser(clerkId);

    const email =
      clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
      clerkUser.emailAddresses?.[0]?.emailAddress ||
      '';

    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() ||
      clerkUser.username ||
      email.split('@')[0] ||
      'User';

    const imageUrl = clerkUser.imageUrl ?? undefined;

    try {
      const upsertedUser = await prisma.user.upsert({
        where: { clerkId },
        update: { email, name, imageUrl, isDeleted: false },
        create: { clerkId, email, name, imageUrl, isDeleted: false },
        select: { id: true },
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Auth] User upserted successfully. internalId=${upsertedUser.id}`);
      }

      return upsertedUser.id;
    } catch (upsertError: any) {
      // P2002 = unique constraint violation — two concurrent requests raced past the
      // fast-path findUnique and both tried to INSERT. The winner already committed;
      // we just need to read the record that's now guaranteed to exist.
      if (upsertError?.code === 'P2002') {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[Auth] Duplicate upsert race detected for clerkId=${clerkId}. Falling back to findUnique.`);
        }
        const recovered = await prisma.user.findUnique({
          where: { clerkId },
          select: { id: true },
        });
        if (recovered) return recovered.id;
      }
      throw upsertError;
    }
  } catch (error) {
    console.error('[Auth] Failed to upsert user from Clerk:', error);
    return null;
  }
};
