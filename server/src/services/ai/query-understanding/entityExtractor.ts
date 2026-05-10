import { ExtractedMetadata } from './types';

/**
 * A lightweight regex and rule-based entity extractor.
 * Extracts dates, technologies, topics, and folders without heavy NLP dependencies.
 */
export function extractEntities(query: string): ExtractedMetadata {
  const lowerQuery = query.toLowerCase();

  const metadata: ExtractedMetadata = {
    dates: [],
    dateRange: null,
    technologies: [],
    topics: [],
    folders: [],
    noteReferences: []
  };

  // 1. Extract Technologies (Extendable dictionary)
  const knownTechs = [
    'react', 'node', 'express', 'typescript', 'javascript', 'python',
    'postgres', 'postgresql', 'prisma', 'docker', 'kubernetes', 'aws',
    'aws lambda', 'huggingface', 'groq', 'tailwind', 'nextjs', 'backend', 'frontend'
  ];
  
  knownTechs.forEach(tech => {
    // Word boundary to avoid partial matches
    const regex = new RegExp(`\\b${tech}\\b`, 'i');
    if (regex.test(lowerQuery)) {
      metadata.technologies.push(tech.charAt(0).toUpperCase() + tech.slice(1));
    }
  });

  // 2. Extract Dates & Relative Time
  const now = new Date();
  if (lowerQuery.includes('yesterday')) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    metadata.dates.push('yesterday');
    metadata.dateRange = { start: yesterday.toISOString(), end: yesterday.toISOString(), raw: 'yesterday' };
  } else if (lowerQuery.includes('last week')) {
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - 7);
    metadata.dates.push('last week');
    metadata.dateRange = { start: lastWeekStart.toISOString(), end: now.toISOString(), raw: 'last week' };
  } else if (lowerQuery.includes('last month')) {
    const lastMonthStart = new Date(now);
    lastMonthStart.setMonth(now.getMonth() - 1);
    metadata.dates.push('last month');
    metadata.dateRange = { start: lastMonthStart.toISOString(), end: now.toISOString(), raw: 'last month' };
  } else if (lowerQuery.includes('today')) {
    metadata.dates.push('today');
    metadata.dateRange = { start: now.toISOString(), end: now.toISOString(), raw: 'today' };
  }

  // 3. Extract Note References (e.g., "notes about X", "X discussion")
  // Matches "notes about <topic>" or "discussion on <topic>"
  const noteRegex = /(?:notes? about|notes? on|discussion on|show me) ([a-zA-Z0-9 ]+)/i;
  const noteMatch = query.match(noteRegex);
  if (noteMatch && noteMatch[1]) {
    const extractedRef = noteMatch[1].replace(/\b(?:notes?|folder|discussion)\b/ig, '').trim();
    if (extractedRef) {
      metadata.noteReferences.push(extractedRef);
    }
  }

  // 4. Extract Folders (e.g., "in backend folder", "in the UI folder")
  const folderRegex = /in (?:the )?([a-zA-Z0-9_-]+) folder/i;
  const folderMatch = query.match(folderRegex);
  if (folderMatch && folderMatch[1]) {
    metadata.folders.push(folderMatch[1].trim());
  }

  // 5. Aggregate General Topics
  // Merge technologies and note references to create a broad topics array
  metadata.topics = Array.from(new Set([
    ...metadata.technologies, 
    ...metadata.noteReferences.map(ref => ref.toLowerCase())
  ]));

  return metadata;
}
