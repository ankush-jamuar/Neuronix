import { Request, Response } from 'express';
import { getInternalUserId } from '../utils/auth';
import { FolderService } from '../services/folder.service';

const folderService = new FolderService();

export class FolderController {
  
  getFolders = async (req: Request, res: Response): Promise<void> => {
    try {
      const internalUserId = await getInternalUserId(req);
      if (!internalUserId) { res.status(401).json({ error: 'UNAUTHORIZED' }); return; }

      const folders = await folderService.getFoldersByUser(internalUserId);
      res.status(200).json(folders);
    } catch (error) {
      console.error('Error fetching folders:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  createFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const internalUserId = await getInternalUserId(req);
      if (!internalUserId) { res.status(401).json({ error: 'UNAUTHORIZED' }); return; }

      const { name, parentId } = req.body;
      if (!name || typeof name !== 'string') {
        res.status(400).json({ error: 'Name is required' });
        return;
      }

      const folder = await folderService.createFolder(internalUserId, name, parentId);
      res.status(201).json(folder);
    } catch (error) {
      console.error('Error creating folder:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  renameFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const internalUserId = await getInternalUserId(req);
      if (!internalUserId) { res.status(401).json({ error: 'UNAUTHORIZED' }); return; }

      const { id } = req.params;
      const { name } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ error: 'Valid name is required' });
        return;
      }

      const folder = await folderService.renameFolder(id, internalUserId, name);
      if (!folder) { res.status(404).json({ error: 'NOT_FOUND' }); return; }

      res.status(200).json(folder);
    } catch (error) {
      console.error('Error renaming folder:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  deleteFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const internalUserId = await getInternalUserId(req);
      if (!internalUserId) { res.status(401).json({ error: 'UNAUTHORIZED' }); return; }

      const { id } = req.params;
      const success = await folderService.deleteFolder(id, internalUserId);

      if (!success) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting folder:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
