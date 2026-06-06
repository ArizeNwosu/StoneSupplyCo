-- AlterTable
ALTER TABLE "TrackedAccount" ADD COLUMN     "authenticityScore" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "apiKeyHash" TEXT,
ADD COLUMN     "apiKeyPrefix" TEXT;
