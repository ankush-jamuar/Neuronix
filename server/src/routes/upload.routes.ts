import { Router, Request, Response, NextFunction } from 'express';
import { handleUpload } from '../controllers/upload.controller';
import { uploadMiddleware } from '../middleware/upload.middleware';
import { clerkAuth } from '../middleware/auth';
import multer from 'multer';

const router = Router();

const uploadHandler = (req: Request, res: Response, next: NextFunction) => {
  const upload = uploadMiddleware.single('file');
  upload(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'File size exceeds the 10MB limit' });
        return;
      }
      res.status(400).json({ error: `Upload error: ${err.message}` });
      return;
    } else if (err) {
      if (err.message === 'INVALID_FILE_TYPE') {
        res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, and PDF are allowed' });
        return;
      }
      console.error('Unknown upload error:', err);
      res.status(500).json({ error: 'An unknown error occurred during upload' });
      return;
    }
    next();
  });
};

// Protect this route, then process file, then handle request
router.post('/', clerkAuth, uploadHandler, handleUpload);

export default router;
