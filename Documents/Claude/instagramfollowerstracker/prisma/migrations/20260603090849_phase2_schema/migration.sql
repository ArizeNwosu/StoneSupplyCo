-- CreateEnum
CREATE TYPE "ExportSource" AS ENUM ('MANUAL_UPLOAD', 'EYI_AUTO');

-- CreateEnum
CREATE TYPE "ExportJobType" AS ENUM ('FOLLOWERS_CSV', 'FOLLOWING_CSV', 'UNFOLLOW_DIFF_CSV', 'SCHEDULED_MONTHLY');

-- CreateEnum
CREATE TYPE "ExportJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED', 'EXPIRED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AlertType" ADD VALUE 'SNAPSHOT_MILESTONE';
ALTER TYPE "AlertType" ADD VALUE 'WEEKLY_SUMMARY';

-- AlterTable
ALTER TABLE "TrackedAccount" ADD COLUMN     "milestone1Sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "milestone30Sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "milestone3Sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "milestone7Sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "snapshotCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "eyiConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "eyiConnectedAt" TIMESTAMP(3),
ADD COLUMN     "metaUserId" TEXT;

-- CreateTable
CREATE TABLE "DataExport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "ExportSource" NOT NULL DEFAULT 'MANUAL_UPLOAD',
    "followerCount" INTEGER,
    "followingCount" INTEGER,

    CONSTRAINT "DataExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportFollower" (
    "id" TEXT NOT NULL,
    "dataExportId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT,
    "followedAt" TIMESTAMP(3),

    CONSTRAINT "ExportFollower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportFollowing" (
    "id" TEXT NOT NULL,
    "dataExportId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT,
    "followedAt" TIMESTAMP(3),

    CONSTRAINT "ExportFollowing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ExportJobType" NOT NULL,
    "status" "ExportJobStatus" NOT NULL DEFAULT 'PENDING',
    "downloadUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ExportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExportFollower_dataExportId_idx" ON "ExportFollower"("dataExportId");

-- CreateIndex
CREATE INDEX "ExportFollower_handle_idx" ON "ExportFollower"("handle");

-- CreateIndex
CREATE INDEX "ExportFollowing_dataExportId_idx" ON "ExportFollowing"("dataExportId");

-- CreateIndex
CREATE INDEX "ExportFollowing_handle_idx" ON "ExportFollowing"("handle");

-- CreateIndex
CREATE INDEX "ExportJob_userId_status_idx" ON "ExportJob"("userId", "status");

-- AddForeignKey
ALTER TABLE "DataExport" ADD CONSTRAINT "DataExport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportFollower" ADD CONSTRAINT "ExportFollower_dataExportId_fkey" FOREIGN KEY ("dataExportId") REFERENCES "DataExport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportFollowing" ADD CONSTRAINT "ExportFollowing_dataExportId_fkey" FOREIGN KEY ("dataExportId") REFERENCES "DataExport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportJob" ADD CONSTRAINT "ExportJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
