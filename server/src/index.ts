import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { clerkAuth } from './middleware/auth';
import apiRoutes from './routes/api';
import webhookRoutes from './routes/webhook';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Mount webhook route strictly BEFORE express.json()
app.use('/api/webhooks', webhookRoutes);

// Register Clerk Middleware
app.use(clerkAuth);

app.use(express.json());

// Healthcheck endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

// Mount API routes
app.use('/api', apiRoutes);

// Global Error Handler to guarantee JSON response instead of HTML
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled Global Error:", err.stack || err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
