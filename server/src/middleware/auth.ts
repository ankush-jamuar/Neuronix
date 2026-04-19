import { clerkMiddleware } from '@clerk/express';

// Validates Clerk JWT, extracts user identity
export const clerkAuth = clerkMiddleware();
