import { Request, Response } from "express";
import { askAI } from "../services/ai/aiChatService";
import { getInternalUserId } from "../utils/auth";
import { logUsage } from "../services/usage.service";

export async function askAIController(req: Request, res: Response) {
  try {
    const internalUserId = await getInternalUserId(req);
    
    if (!internalUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { question, sessionId, mode } = req.body;

    const result = await askAI({
      userId: internalUserId,
      question,
      sessionId,
      mode
    });

    // Async log usage (don't block response)
    void logUsage(internalUserId, { queries: 1 });

    res.json(result);
  } catch (error: any) {
    console.error("[AI Chat Error] FATAL EXCEPTION:", error);
    res.status(500).json({ 
      error: "AI failed",
      message: error?.message || "Unknown error",
      stack: process.env.NODE_ENV === "development" ? error?.stack : undefined
    });
  }
}
