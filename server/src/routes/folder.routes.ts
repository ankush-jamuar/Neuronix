import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { FolderController } from '../controllers/folder.controller';

const router = Router();
const folderController = new FolderController();

router.use(requireAuth());

router.get('/', folderController.getFolders);
router.post('/', folderController.createFolder);
router.patch('/:id', folderController.renameFolder);
router.delete('/:id', folderController.deleteFolder);

export default router;
