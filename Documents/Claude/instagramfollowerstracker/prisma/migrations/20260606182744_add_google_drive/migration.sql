-- AlterEnum
ALTER TYPE "ExportSource" ADD VALUE 'GOOGLE_DRIVE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleAccessToken" TEXT,
ADD COLUMN     "googleDriveConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "googleDriveLastSync" TIMESTAMP(3),
ADD COLUMN     "googleRefreshToken" TEXT,
ADD COLUMN     "googleTokenExpiry" TIMESTAMP(3);
