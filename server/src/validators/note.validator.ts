import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().optional(),
});

export const updateNoteSchema = z.object({
  title: z.string().optional(),
  content: z.any().optional(),
  textContent: z.string().optional(),
  lastUpdatedAt: z.string().optional(),
});
