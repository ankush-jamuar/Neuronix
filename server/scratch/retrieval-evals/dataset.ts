export interface EvalTestCase {
  id: string;
  query: string;
  expectedIntent: string;
  expectedFilters: string[]; // Fields we expect to be filtered on
  expectedSemanticFallback?: boolean;
}

export const DATASET: EvalTestCase[] = [
  {
    id: "time-aware",
    query: "What did I study last week about Prisma?",
    expectedIntent: "time_based_search",
    expectedFilters: ["createdAt"] // We expect a dateRange filter which translates to createdAt
  },
  {
    id: "folder-aware",
    query: "Find backend authentication notes",
    expectedIntent: "semantic_search",
    expectedFilters: ["folder"] // Expect folder filter 
  },
  {
    id: "tech-aware",
    query: "Show my PostgreSQL vector search notes",
    expectedIntent: "semantic_search",
    expectedFilters: ["tags"] // PostgreSQL should map to tags
  },
  {
    id: "semantic-fallback",
    query: "Explain RAG architecture",
    expectedIntent: "semantic_search",
    expectedFilters: [], // No explicit metadata expected
    expectedSemanticFallback: true
  }
];
