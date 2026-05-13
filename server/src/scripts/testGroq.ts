import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GROQ_API_KEY;

async function testGroq() {
  console.log("========== GROQ ISOLATION TEST ==========");
  console.log("API Key Exists:", !!apiKey);
  if (apiKey) {
    console.log("Key starts with:", apiKey.substring(0, 7));
  }

  if (!apiKey) {
    console.error("❌ ERROR: GROQ_API_KEY is missing from .env");
    return;
  }

  const groq = new Groq({ apiKey });

  try {
    console.log("Calling Groq (llama-3.1-8b-instant)...");
    const startTime = Date.now();
    
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a helpful assistant. Keep your response under 5 words." },
        { role: "user", content: "Say hello!" },
      ],
      temperature: 0.3,
      max_tokens: 10,
    });

    const duration = Date.now() - startTime;
    console.log("✅ Groq Success! (took " + duration + "ms)");
    console.log("Response:", JSON.stringify(completion.choices[0]?.message?.content));
    console.log("Full Object Preview:", JSON.stringify(completion.choices[0]).substring(0, 100));

  } catch (error: any) {
    console.error("❌ Groq Failure!");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    if (error.response) {
      console.error("Response Body:", error.response.data);
    }
  }
}

testGroq();
