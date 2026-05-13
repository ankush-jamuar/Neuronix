import { Request, Response } from "express";
import { askAI } from "../services/ai/aiChatService";
import { getAuth } from "@clerk/express";

export async function askAIController(req: Request, res: Response) {
  try {
    const { userId } = getAuth(req);
    
    console.log("UserId from Clerk:", userId);

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { question } = req.body;

    const answer = await askAI(userId, question);

    res.json({ answer });
  } catch (error: any) {
    console.error("[AI Chat Error] FATAL EXCEPTION:", error);
    res.status(500).json({ 
      error: "AI failed",
      message: error?.message || "Unknown error",
      stack: process.env.NODE_ENV === "development" ? error?.stack : undefined
    });
  }
}
