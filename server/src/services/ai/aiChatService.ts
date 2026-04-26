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

  const chunks = await prisma.documentChunk.findMany({
    include: {
      note: {
        include: {
          user: true
        }
      }
    },
  });

  console.log("ALL CHUNKS RAW:", chunks);

  const filteredChunks = chunks.filter((chunk: any) => 
    chunk.note &&
    chunk.note.user &&
    chunk.note.user.clerkId === userId &&
    chunk.note.isDeleted === false
  );

  console.log("FILTERED CHUNKS:", filteredChunks);

  const cleanQuery = question
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // remove punctuation
    .trim();

  const keywords = cleanQuery.split(/\s+/);

  const matchedChunks = filteredChunks.filter(chunk => {
    const content = chunk.content
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return keywords.some(word =>
      content.includes(word) ||
      word.includes(content) ||
      content.split(" ").some(c => c.startsWith(word))
    );
  });

  let finalChunks = matchedChunks;

  if (finalChunks.length === 0) {
    console.log("⚠️ No strict match, using fallback...");

    finalChunks = filteredChunks.filter(chunk => {
      const content = chunk.content.toLowerCase();
      return keywords.some(word =>
        content.includes(word.slice(0, 3)) // partial match
      );
    });
  }

  console.log("KEYWORDS:", keywords);
  console.log("MATCHED CHUNKS:", finalChunks);

  const context = finalChunks.map(c => c.content).join("\n\n");

  console.log("FINAL CONTEXT:", context);

  if (!context || context.trim() === "") {
    return "I don't have enough information in your notes.";
  }

  const prompt = `
You are an AI assistant for a note-taking app.

STRICT RULES:
- Answer ONLY using the provided context
- DO NOT add external knowledge
- DO NOT guess
- DO NOT explain beyond the text
- If answer is not found, say:
  "I don't have enough information in your notes."

Context:
${context}

Question:
${question}

Answer:
`;

  // 🔹 Call Groq
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "user", content: prompt },
    ],
  });

  return completion.choices[0]?.message?.content || "No response";
}
