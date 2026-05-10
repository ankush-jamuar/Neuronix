import { prisma } from "../../lib/prisma";
import Groq from "groq-sdk";
import { semanticSearch } from "./semanticSearchService";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function askAI(userId: string, question: string) {
  if (!question || question.trim().length === 0) {
    throw new Error("Question is required");
  }

  const rawChunks: any[] = await prisma.$queryRaw`
    SELECT 
      dc.id, 
      dc.content, 
      dc.embedding::text as embedding
    FROM "DocumentChunk" dc
    JOIN "Note" n ON dc."noteId" = n.id
    JOIN "User" u ON n."userId" = u.id
    WHERE n."isDeleted" = false 
      AND u."clerkId" = ${userId}
  `;

  const validChunks = rawChunks
    .map(chunk => ({
      content: chunk.content,
      embedding: chunk.embedding ? JSON.parse(chunk.embedding) : null
    }))
    .filter(c => c.embedding !== null);

  console.log("VALID CHUNKS:", validChunks.length);

  const cleanQuery = question.toLowerCase();
  const keywords = cleanQuery.split(" ");

  const { generateEmbedding } = await import("./embeddingService");
  const queryEmbedding = await generateEmbedding(cleanQuery);

  function cosineSimilarity(a: number[], b: number[]) {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (magA * magB);
  }

  const scoredChunks = validChunks.map(chunk => {
    const content = (chunk.content || "").toLowerCase();
    let keywordScore = 0;

    keywords.forEach((word: string) => {
      if (content.includes(word)) {
        keywordScore++;
      }
    });

    const semanticScore = cosineSimilarity(queryEmbedding, chunk.embedding);

    return {
      ...chunk,
      score: keywordScore * 0.4 + semanticScore * 0.6
    };
  });

  const sorted = scoredChunks.sort((a: any, b: any) => b.score - a.score);

  const filtered = sorted.filter((chunk: any) => chunk.score > 0.3);

  if (filtered.length === 0) {
    return "I don't have enough information in your notes.";
  }

  const topChunks = filtered.slice(0, 3);

  const MAX_CONTEXT_CHARS = 1000;
  let context = "";

  for (const chunk of topChunks) {
    if ((context + chunk.content).length > MAX_CONTEXT_CHARS) break;
    context += chunk.content + "\n";
  }

  console.log("SORTED:", sorted.map((c: any) => ({
    content: c.content.slice(0, 50),
    score: c.score
  })));

  console.log("FILTERED:", filtered.length);
  console.log("TOP CHUNKS:", topChunks.map((c: any) => c.content));
  console.log("FINAL CONTEXT:", context);

  return context;
}
