let extractor: any = null;

/**
 * Initializes the embedding model.
 * Should be called once at server startup to avoid cold-start latency.
 */
export async function initEmbeddingModel() {
  if (extractor) return;
  
  try {
    console.log("🔄 Initializing embedding model...");
    const { pipeline } = await import("@xenova/transformers");
    
    extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    console.log("✅ Embedding model initialized and cached");
  } catch (error) {
    console.error("[EmbeddingService] Failed to initialize model:", error);
    throw error;
  }
}

/**
 * Generates embedding using local model (Xenova)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    if (!extractor) {
      await initEmbeddingModel();
    }

    // Generate embedding
    const output = await extractor(text, {
      pooling: "mean",
      normalize: true,
    });

    return Array.from(output.data);

  } catch (error) {
    console.error("[EmbeddingService] Local embedding error:", error);
    throw error;
  }
}