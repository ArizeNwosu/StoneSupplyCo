-- CreateTable
CREATE TABLE "ReportLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "trackedAccountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "expiresAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReportLink_token_key" ON "ReportLink"("token");

-- CreateIndex
CREATE INDEX "ReportLink_token_idx" ON "ReportLink"("token");

-- CreateIndex
CREATE INDEX "ReportLink_userId_idx" ON "ReportLink"("userId");

-- AddForeignKey
ALTER TABLE "ReportLink" ADD CONSTRAINT "ReportLink_trackedAccountId_fkey" FOREIGN KEY ("trackedAccountId") REFERENCES "TrackedAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportLink" ADD CONSTRAINT "ReportLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
