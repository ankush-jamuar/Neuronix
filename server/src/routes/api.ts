import { Router, Request, Response } from 'express';
import { getAuth } from '@clerk/express';

const router = Router();

// Test protected route verifying current user identity
router.get('/me', (req: Request, res: Response): void => {
  try {
    // Use getAuth to extract auth state from the request (supports Authorization: Bearer <token>)
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

export default router;
