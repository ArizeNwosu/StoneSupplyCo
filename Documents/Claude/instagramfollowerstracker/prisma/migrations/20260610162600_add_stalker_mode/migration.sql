-- CreateEnum
CREATE TYPE "StalkerFrequency" AS ENUM ('DAILY', 'SIX_HOUR', 'HOURLY');

-- CreateEnum
CREATE TYPE "StalkerSource" AS ENUM ('STRIPE', 'PRO_INCLUDED');

-- CreateEnum
CREATE TYPE "StalkerSignal" AS ENUM ('BIO_CHANGED', 'LINK_CHANGED', 'AVATAR_CHANGED', 'NEW_POST', 'POST_DELETED', 'NEW_FOLLOW', 'WENT_PRIVATE', 'DISPLAY_NAME_CHANGED', 'USERNAME_CHANGED', 'VERIFIED_CHANGED', 'CATEGORY_CHANGED', 'PRONOUNS_CHANGED');

-- CreateTable
CREATE TABLE "StalkerSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackedAccountId" TEXT NOT NULL,
    "frequency" "StalkerFrequency" NOT NULL DEFAULT 'DAILY',
    "source" "StalkerSource" NOT NULL DEFAULT 'STRIPE',
    "stripePriceId" TEXT,
    "stripeSubId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StalkerSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StalkerProfile" (
    "id" TEXT NOT NULL,
    "trackedAccountId" TEXT NOT NULL,
    "instagramUserId" TEXT,
    "username" TEXT,
    "displayName" TEXT,
    "bio" TEXT,
    "externalUrl" TEXT,
    "avatarUrl" TEXT,
    "postCount" INTEGER,
    "highlightCount" INTEGER,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "pronouns" TEXT[],
    "recentFollowing" TEXT[],
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StalkerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StalkerEvent" (
    "id" TEXT NOT NULL,
    "stalkerSubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signal" "StalkerSignal" NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StalkerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StalkerSubscription_active_frequency_idx" ON "StalkerSubscription"("active", "frequency");

-- CreateIndex
CREATE UNIQUE INDEX "StalkerSubscription_userId_trackedAccountId_key" ON "StalkerSubscription"("userId", "trackedAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "StalkerProfile_trackedAccountId_key" ON "StalkerProfile"("trackedAccountId");

-- CreateIndex
CREATE INDEX "StalkerEvent_userId_read_createdAt_idx" ON "StalkerEvent"("userId", "read", "createdAt");

-- CreateIndex
CREATE INDEX "StalkerEvent_stalkerSubId_createdAt_idx" ON "StalkerEvent"("stalkerSubId", "createdAt");

-- AddForeignKey
ALTER TABLE "StalkerSubscription" ADD CONSTRAINT "StalkerSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StalkerSubscription" ADD CONSTRAINT "StalkerSubscription_trackedAccountId_fkey" FOREIGN KEY ("trackedAccountId") REFERENCES "TrackedAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StalkerProfile" ADD CONSTRAINT "StalkerProfile_trackedAccountId_fkey" FOREIGN KEY ("trackedAccountId") REFERENCES "TrackedAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StalkerEvent" ADD CONSTRAINT "StalkerEvent_stalkerSubId_fkey" FOREIGN KEY ("stalkerSubId") REFERENCES "StalkerSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StalkerEvent" ADD CONSTRAINT "StalkerEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
