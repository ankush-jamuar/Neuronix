import { Request, Response } from 'express';
import { NoteService } from '../services/note.service';
import { getInternalUserId } from '../utils/auth';

const noteService = new NoteService();

export class NoteController {
  
  getNotes = async (req: Request, res: Response): Promise<void> => {
    try {
      const internalUserId = await getInternalUserId(req);
      if (!internalUserId) {
        res.status(401).json({ error: 'UNAUTHORIZED' });
        return;
      }

      const notes = await noteService.getNotesByUser(internalUserId);
      res.status(200).json(notes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  createNote = async (req: Request, res: Response): Promise<void> => {
    try {
      const internalUserId = await getInternalUserId(req);
      if (!internalUserId) {
        res.status(401).json({ error: 'UNAUTHORIZED' });
        return;
      }

      let { title, folderId } = req.body;
      if (!title || typeof title !== 'string' || title.trim() === '') {
        title = "Untitled";
      }

      const note = await noteService.createNote(internalUserId, title, folderId);
      
      res.status(201).json(note);
    } catch (error) {
      console.error('Error creating note:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  getNoteById = async (req: Request, res: Response): Promise<void> => {
    try {
      const internalUserId = await getInternalUserId(req);
      if (!internalUserId) {
        res.status(401).json({ error: 'UNAUTHORIZED' });
        return;
      }

      const { id } = req.params;
      const note = await noteService.getNoteById(id, internalUserId);
      
      if (!note) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      res.status(200).json(note);
    } catch (error) {
      console.error('Error fetching note by id:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  updateNote = async (req: Request, res: Response): Promise<void> => {
    try {
      const internalUserId = await getInternalUserId(req);
      if (!internalUserId) {
        res.status(401).json({ error: 'UNAUTHORIZED' });
        return;
      }

      const { id } = req.params;
      const { title, content, textContent, lastUpdatedAt, isFavorite, folderId, tags } = req.body;
      
      const note = await noteService.updateNote(internalUserId, id, {
        title,
        content,
        textContent,
        lastUpdatedAt,
        isFavorite,
        folderId,
        tags
      });
      
      res.status(200).json(note);
    } catch (error: any) {
      console.error('Error updating note:', error);
      if (error.message === 'NOT_FOUND') {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  deleteNote = async (req: Request, res: Response): Promise<void> => {
    try {
      const internalUserId = await getInternalUserId(req);
      if (!internalUserId) {
        res.status(401).json({ error: 'UNAUTHORIZED' });
        return;
      }

      const { id } = req.params;
      const success = await noteService.deleteNote(id, internalUserId);

      if (!success) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting note:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
