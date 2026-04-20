import { Request, Response } from 'express';
import { formatUploadResponse } from '../services/upload.service';

export const handleUpload = (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    const response = formatUploadResponse(req.file);
    res.status(200).json(response);
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Failed to process file upload' });
  }
};
