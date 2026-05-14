/*
  Warnings:

  - The values [AI] on the enum `AIContextRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "ChatMessageStatus" AS ENUM ('PENDING', 'STREAMING', 'COMPLETED', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "AIContextRole_new" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
ALTER TABLE "ChatMessage" ALTER COLUMN "role" TYPE "AIContextRole_new" USING ("role"::text::"AIContextRole_new");
ALTER TYPE "AIContextRole" RENAME TO "AIContextRole_old";
ALTER TYPE "AIContextRole_new" RENAME TO "AIContextRole";
DROP TYPE "public"."AIContextRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "status" "ChatMessageStatus" NOT NULL DEFAULT 'COMPLETED';
