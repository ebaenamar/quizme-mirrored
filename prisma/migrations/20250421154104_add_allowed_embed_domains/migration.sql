-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "allowedEmbedDomains" TEXT[] DEFAULT ARRAY[]::TEXT[];
