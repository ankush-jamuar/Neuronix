import { analyzeQuery } from "../src/services/ai/query-understanding";
import { performHybridSearch, assembleContext } from "../src/services/ai/retrieval";

// Note: Ensure ts-node is installed to run this script directly, 
// or compile it if necessary.
// Run with: npx ts-node scratch/testRetrieval.ts

async function testScenario(scenarioName: string, userId: string, query: string) {
  console.log(`\n================================`);
  console.log(`SCENARIO: ${scenarioName}`);
  console.log(`================================`);
  console.log(`Query: "${query}"\n`);

  try {
    // 1. Analyze
    const analysis = analyzeQuery(query);
    console.log(`Intent: ${analysis.intent} (Confidence: ${analysis.confidence})`);
    console.log(`Normalized: "${analysis.normalizedQuery}"`);
    console.log(`Metadata:`, JSON.stringify(analysis.metadata, null, 2));

    // 2. Mock embedding generation
    // In a real run, this would call generateEmbedding
    const mockEmbedding = Array(384).fill(0.1); 

    // 3. Perform Hybrid Search
    console.log(`\nExecuting Hybrid Search...`);
    const results = await performHybridSearch({
      userId,
      originalQuery: query,
      normalizedQuery: analysis.normalizedQuery,
      embedding: mockEmbedding,
      metadata: analysis.metadata,
      limit: 5
    });

    console.log(`Returned ${results.length} chunks.`);
    
    if (results.length > 0) {
      console.log(`Top chunk final score: ${results[0].finalScore}`);
    }

    // 4. Assemble Context
    const context = assembleContext(results, { topK: 3, maxChars: 2000 });
    console.log(`\nContext Size: ${context.length} chars`);
    console.log(`Context Preview:\n${context.slice(0, 150)}...`);

  } catch (error) {
    console.error(`Error in scenario ${scenarioName}:`, error);
  }
}

async function runTests() {
  const TEST_USER_ID = "test-user-id"; // Ensure this user exists or mock it if strictly needed

  await testScenario(
    "Time-aware query", 
    TEST_USER_ID, 
    "What did I study last week about Prisma?"
  );

  await testScenario(
    "Folder-aware query", 
    TEST_USER_ID, 
    "Find backend authentication notes"
  );

  await testScenario(
    "Technology-aware query", 
    TEST_USER_ID, 
    "Show my PostgreSQL vector search notes"
  );

  await testScenario(
    "Generic semantic query", 
    TEST_USER_ID, 
    "Explain RAG architecture"
  );
}

runTests().then(() => {
  console.log("\nTests complete.");
  process.exit(0);
}).catch(e => {
  console.error("Test suite failed:", e);
  process.exit(1);
});
