import { Request } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../lib/prisma';

export const getInternalUserId = async (req: Request): Promise<string | null> => {
  const auth = getAuth(req);
  
  if (process.env.NODE_ENV === 'development') {
    console.log("Auth Object:", auth);
    console.log('--- DEBUG: Backend Auth State ---', { userId: auth?.userId });
  }

  if (!auth || !auth.userId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('--- DEBUG: Missing auth or auth.userId from getAuth() ---');
    }
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { clerkId: auth.userId },
    select: { id: true }
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log('--- DEBUG: DB User Resolution ---', { found: !!user, clerkId: auth.userId, internalId: user?.id });
  }

  if (!user) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('--- DEBUG: User mismatch! Clerk user exists, but Internal DB user is missing. Returning null. ---');
    }
    return null;
  }
  
  return user.id;
};
