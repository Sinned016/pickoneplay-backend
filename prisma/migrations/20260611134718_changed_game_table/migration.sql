-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'random',
ADD COLUMN     "tags" TEXT[];
