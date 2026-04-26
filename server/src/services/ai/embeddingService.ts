import { pipeline } from "@xenova/transformers";

let extractor: any = null;

/**
 * Generates embedding using local model (Xenova)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Lazy load model (only once)
    if (!extractor) {
      console.log("🔄 Loading embedding model...");
      
      extractor = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      );

      console.log("✅ Model loaded");
    }

    // Generate embedding
    const output = await extractor(text, {
      pooling: "mean",
      normalize: true,
    });

    // Convert to flat array
    return Array.from(output.data);

  } catch (error) {
    console.error("[EmbeddingService] Local embedding error:", error);
    throw error;
  }
}
