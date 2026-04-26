-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: add_pgvector_embeddings
-- Adds pgvector extension and upgrades DocumentChunk.embedding to vector(384)
-- for sentence-transformers/all-MiniLM-L6-v2 compatibility.
-- Safe: embedding column is currently NULL for all rows.
-- ─────────────────────────────────────────────────────────────────────────────

-- Step 1: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Drop TEXT column and recreate as vector(384)
-- (Safe because no data exists in the embedding column yet)
ALTER TABLE "DocumentChunk" DROP COLUMN IF EXISTS embedding;
ALTER TABLE "DocumentChunk" ADD COLUMN embedding vector(384);

-- Step 3: HNSW index for efficient cosine similarity search
-- HNSW preferred over IVFFlat: no training data required, better recall on
-- growing datasets, and significantly faster approximate nearest-neighbor queries.
CREATE INDEX IF NOT EXISTS document_chunk_embedding_hnsw_idx
ON "DocumentChunk"
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
