export type QueryIntent =
  | 'semantic_search'
  | 'time_based_search'
  | 'revision_query'
  | 'note_lookup'
  | 'summary_request'
  | 'greeting'
  | 'casual'
  | 'unknown';

export interface IntentClassification {
  intent: QueryIntent;
  confidence: number;
}

export interface DateRange {
  start: string; // ISO string
  end: string;   // ISO string
  raw?: string;
}

export interface ExtractedMetadata {
  dates: string[];
  dateRange: DateRange | null;
  technologies: string[];
  topics: string[];
  folders: string[];
  noteReferences: string[];
}

export interface QueryAnalysisResult {
  originalQuery: string;
  normalizedQuery: string;
  intent: QueryIntent;
  confidence: number;
  metadata: ExtractedMetadata;
}
