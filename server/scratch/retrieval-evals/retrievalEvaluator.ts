import { DATASET } from "./dataset";
import { analyzeQuery } from "../../src/services/ai/query-understanding";
import { performHybridSearch, assembleContext } from "../../src/services/ai/retrieval";
import { RetrievalDebugger } from "../../src/services/ai/retrieval/debug/retrievalDebugger";

// Run with: npx ts-node scratch/retrieval-evals/retrievalEvaluator.ts

async function evaluateScenario(testCase: any, userId: string) {
  console.log(`\nEvaluating [${testCase.id}]: "${testCase.query}"`);
  
  const dbg = new RetrievalDebugger(testCase.query);
  let stepTime = Date.now();
  
  const analysis = analyzeQuery(testCase.query);
  dbg.setQueryAnalysis(analysis, Date.now() - stepTime);
  
  let passed = true;
  const issues: string[] = [];

  // 1. Evaluate Intent
  if (analysis.intent !== testCase.expectedIntent && analysis.intent !== 'semantic_search') {
    passed = false;
    issues.push(`Intent mismatch: Expected ${testCase.expectedIntent}, got ${analysis.intent}`);
  }

  // Mock embedding
  const mockEmbedding = Array(384).fill(0.01);

  // 2. Perform Retrieval
  const hybridResults = await performHybridSearch({
    userId,
    originalQuery: testCase.query,
    normalizedQuery: analysis.normalizedQuery,
    embedding: mockEmbedding,
    metadata: analysis.metadata,
    limit: 5,
    debugger: dbg
  });

  assembleContext(hybridResults, { maxChars: 2000, topK: 3, debugger: dbg });

  const trace = dbg.finalizeAndLog();

  // 3. Evaluate Filters
  for (const expectedFilter of testCase.expectedFilters) {
    if (!trace.prismaFilters || !(expectedFilter in trace.prismaFilters)) {
      passed = false;
      issues.push(`Missing expected filter: ${expectedFilter}`);
    }
  }

  // 4. Diagnostics Checks
  if (trace.anomalies && trace.anomalies.length > 0) {
    issues.push(...trace.anomalies);
    // Not necessarily a "fail", but a strong warning.
  }

  console.log(`Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  if (issues.length > 0) {
    console.log(`Issues detected:\n  - ${issues.join('\n  - ')}`);
  }
  
  console.log(`Latency: ${trace.latencyMetrics.totalMs}ms`);
  
  return { passed, trace };
}

async function runEvaluations() {
  const TEST_USER_ID = "eval-user-id";
  let passCount = 0;

  console.log("=========================================");
  console.log(" STARTING RETRIEVAL QUALITY EVALUATION");
  console.log("=========================================");

  for (const testCase of DATASET) {
    const { passed } = await evaluateScenario(testCase, TEST_USER_ID);
    if (passed) passCount++;
  }

  console.log("\n=========================================");
  console.log(` EVALUATION COMPLETE: ${passCount}/${DATASET.length} PASSED`);
  console.log("=========================================");
}

runEvaluations().then(() => process.exit(0)).catch(e => {
  console.error("Evaluation framework crashed:", e);
  process.exit(1);
});
