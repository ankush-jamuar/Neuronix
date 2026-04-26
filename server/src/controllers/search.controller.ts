import { Request, Response } from "express";
import { semanticSearch } from "../services/ai/semanticSearchService";

export async function searchController(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).auth?.userId || (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    
    const query = req.query.q as string;

    const results = await semanticSearch(userId, query);

    res.json({ results });
  } catch (err) {
    console.error("[SemanticSearch] Error:", err);
    res.status(500).json({ error: "Search failed" });
  }
}
