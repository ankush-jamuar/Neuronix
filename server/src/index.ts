import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { clerkAuth } from './middleware/auth';
import apiRoutes from './routes/api';
import webhookRoutes from './routes/webhook';
import searchRoutes from './routes/search.routes';
import aiRoutes from './routes/ai.routes';
import analyticsRoutes from './routes/analytics.routes';
import chatRoutes from './routes/chat.routes';
import { initEmbeddingModel } from "./services/ai/embeddingService";

const app = express();
const PORT = process.env.PORT || 5000;

app.use((req, res, next) => {
  console.log(`[ROUTE LOGGER] ${req.method} ${req.path}`);
  next();
});

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));


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
app.use('/api/ai', aiRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', apiRoutes);

// Global Error Handler to guarantee JSON response instead of HTML
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled Global Error:", err.stack || err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Global initialization
// initEmbeddingModel().catch(err => {
//   console.error("Failed to pre-load embedding model:", err);
// });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
