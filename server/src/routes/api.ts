import { Router, Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import noteRoutes from './note.routes';
import folderRoutes from './folder.routes';
import uploadRoutes from './upload.routes';

const router = Router();

// Test protected route verifying current user identity
router.get('/me', (req: Request, res: Response): void => {
  try {
    const auth = getAuth(req);
    
    if (!auth || !auth.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    res.json({
      userId: auth.userId
    });
  } catch (error) {
    console.error('Error in /api/me route:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Debug isolation route strictly testing the clerk extraction
router.get('/debug-auth', (req: Request, res: Response) => {
  const auth = getAuth(req);
  if (process.env.NODE_ENV === 'development') {
    console.log("---- DEBUG ENDPOINT ----")
    console.log("Auth Raw headers:", req.headers.authorization);
    console.log("Auth Object:", auth);
  }
  res.json({ success: true, headers: req.headers.authorization, auth });
});

// Resources
router.use('/notes', noteRoutes);
router.use('/folders', folderRoutes);
router.use('/upload', uploadRoutes);

export default router;
