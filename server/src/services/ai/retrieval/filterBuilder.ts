import { Prisma } from "@prisma/client";
import { ExtractedMetadata } from "../query-understanding/types";
import { logger } from "../../../utils/logger";

/**
 * Generates dynamic Prisma filters based on extracted query metadata.
 * Enforces strict retrieval safety by restricting context to active user notes.
 */
export function buildMetadataFilters(
  userId: string, 
  metadata: ExtractedMetadata
): Prisma.NoteWhereInput {
  const filters: Prisma.NoteWhereInput = {
    userId,
    isDeleted: false,
  };

  // 1. Time-aware retrieval
  if (metadata.dateRange) {
    try {
      const start = new Date(metadata.dateRange.start);
      const end = new Date(metadata.dateRange.end);
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        filters.createdAt = {
          gte: start,
          lte: end,
        };
      }
    } catch (error) {
      logger.warn("Failed to parse dateRange in filterBuilder", { dateRange: metadata.dateRange });
    }
  }

  // 2. Technology/Tag-aware retrieval
  if (metadata.technologies && metadata.technologies.length > 0) {
    filters.tags = {
      some: {
        name: {
          in: metadata.technologies,
          mode: 'insensitive'
        }
      }
    };
  }

  // 3. Folder-aware retrieval
  if (metadata.folders && metadata.folders.length > 0) {
    filters.folder = {
      name: {
        in: metadata.folders,
        mode: 'insensitive'
      }
    };
  }

  // Topics and noteReferences can also be added here in the future if we have 
  // fields for them (e.g. searching note titles for noteReferences).
  if (metadata.noteReferences && metadata.noteReferences.length > 0) {
    filters.title = {
      in: metadata.noteReferences,
      mode: 'insensitive'
    };
  }

  return filters;
}
