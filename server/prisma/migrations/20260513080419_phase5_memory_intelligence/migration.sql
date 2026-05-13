-- DropIndex
DROP INDEX "document_chunk_embedding_hnsw_idx";

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "importanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastAccessedAt" TIMESTAMP(3),
ADD COLUMN     "reinforcementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "retrievalCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "revisionCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
