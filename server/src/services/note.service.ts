import { Note } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { processNoteEmbeddings } from './ai/embeddingPipeline';

// ─── Types ───────────────────────────────────────────────────────────────────

type NestedFolder = {
  id: string;
  name: string;
  parentId: string | null;
  parent?: { id: string; name: string; parentId: string | null; parent?: { id: string; name: string; parentId: string | null } | null } | null;
};

export type NoteWithTags = Note & {
  tags: string[];
  folder?: NestedFolder | null;
};

// ─── Service ─────────────────────────────────────────────────────────────────

export class NoteService {
  async getNotesByUser(userId: string): Promise<NoteWithTags[]> {
    const notes = await prisma.note.findMany({
      where: { userId, isDeleted: false },
      include: { tags: true },
      orderBy: { updatedAt: 'desc' },
    });
    return notes.map(n => ({ ...n, tags: n.tags.map(t => t.name) }));
  }

  async getNoteById(noteId: string, userId: string): Promise<NoteWithTags | null> {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        tags: true,
        folder: {
          include: {
            parent: {
              include: { parent: true }
            }
          }
        }
      }
    });
    if (!note || note.userId !== userId || note.isDeleted) {
      return null;
    }
    return { ...note, tags: note.tags.map(t => t.name) };
  }

  async createNote(userId: string, title: string, folderId?: string | null): Promise<NoteWithTags> {
    const note = await prisma.note.create({
      data: {
        title,
        content: { type: 'doc', content: [] },
        textContent: '',
        userId,
        folderId: folderId || null,
      },
      include: { tags: true }
    });

    // Fire-and-forget: generate embeddings after successful note creation.
    // New notes start with empty content, so this is a no-op until the user types.
    // Wrapping in void + IIFE to not await the result.
    void (async () => {
      try {
        await processNoteEmbeddings(note.id, note.textContent ?? '');
      } catch (err) {
        console.error('[EmbeddingPipeline] createNote embedding failed (non-fatal):', err);
      }
    })();

    return { ...note, tags: note.tags.map(t => t.name) };
  }

  async updateNote(
    userId: string,
    noteId: string,
    data: {
      title?: string;
      content?: any;
      textContent?: string;
      lastUpdatedAt?: string;
      isFavorite?: boolean;
      folderId?: string | null;
      tags?: string[];
    }
  ): Promise<NoteWithTags> {
    const existing = await prisma.note.findUnique({
      where: { id: noteId },
      include: { tags: true }
    });
    if (!existing || existing.userId !== userId || existing.isDeleted) {
      throw new Error('NOT_FOUND');
    }

    // Optimistic concurrency check
    if (data.lastUpdatedAt) {
      const incomingDate = new Date(data.lastUpdatedAt);
      if (existing.updatedAt > incomingDate) {
        throw new Error('STALE_UPDATE');
      }
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.textContent !== undefined) updateData.textContent = data.textContent;
    if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
    if (data.folderId !== undefined) updateData.folderId = data.folderId;

    if (data.tags !== undefined) {
      if (!Array.isArray(data.tags)) throw new Error('INVALID_TAGS');

      // Sanitize: lowercase, trim, max 50 chars, unique, non-empty
      const sanitizedTags = data.tags
        .filter(t => typeof t === 'string' && t.trim().length > 0 && t.trim().length <= 50)
        .map(t => t.trim().toLowerCase())
        .filter((t, i, arr) => arr.indexOf(t) === i);

      const existingTagNames = existing.tags.map(t => t.name);
      const tagsToAdd = sanitizedTags.filter(t => !existingTagNames.includes(t));
      const tagsToRemove = existingTagNames.filter(t => !sanitizedTags.includes(t));

      if (tagsToAdd.length > 0 || tagsToRemove.length > 0) {
        updateData.tags = {};
      }
      if (tagsToAdd.length > 0) {
        updateData.tags.connectOrCreate = tagsToAdd.map(t => ({
          where: { name_userId: { name: t, userId } },
          create: { name: t, userId }
        }));
      }
      if (tagsToRemove.length > 0) {
        updateData.tags.disconnect = tagsToRemove.map(t => ({
          name_userId: { name: t, userId }
        }));
      }
    }

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: updateData,
      include: { tags: true }
    });

    // Fire-and-forget: re-generate embeddings after a successful note update.
    // Only triggers when textContent is present (the editor sends it on every save).
    // Failures here are logged but never thrown — API response is unaffected.
    void (async () => {
      try {
        await processNoteEmbeddings(updated.id, updated.textContent ?? '');
      } catch (err) {
        console.error('[EmbeddingPipeline] updateNote embedding failed (non-fatal):', err);
      }
    })();

    return { ...updated, tags: updated.tags.map(t => t.name) };
  }

  async deleteNote(noteId: string, userId: string): Promise<boolean> {
    const note = await prisma.note.findUnique({ where: { id: noteId } });

    if (!note || note.userId !== userId || note.isDeleted) return false;

    await prisma.note.update({
      where: { id: noteId },
      data: { isDeleted: true }
    });

    return true;
  }
}
