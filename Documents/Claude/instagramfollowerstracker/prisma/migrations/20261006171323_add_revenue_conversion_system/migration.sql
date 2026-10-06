-- CreateEnum
CREATE TYPE "RevenueEventType" AS ENUM ('SIGNUP_COMPLETED', 'ACTIVATION_COMPLETED', 'PAYWALL_VIEWED', 'PRICING_VIEWED', 'CHECKOUT_CLICKED', 'CHECKOUT_CREATED', 'CHECKOUT_COMPLETED', 'CHECKOUT_EXPIRED', 'SUBSCRIPTION_ACTIVATED', 'SUBSCRIPTION_CANCELED', 'OUTREACH_QUEUED', 'OUTREACH_SENT', 'OUTREACH_FAILED', 'OUTREACH_REPLIED', 'OUTREACH_UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "CheckoutAttemptStatus" AS ENUM ('CLICKED', 'CREATED', 'COMPLETED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "OutreachMessageStatus" AS ENUM ('QUEUED', 'SENDING', 'SENT', 'FAILED', 'REPLIED', 'SUPPRESSED', 'CANCELED');

-- CreateEnum
CREATE TYPE "OutreachReplyClassification" AS ENUM ('PRICE', 'TRUST', 'VALUE', 'TECHNICAL', 'CHANGED_MIND', 'INTERESTED', 'OTHER');

-- CreateEnum
CREATE TYPE "OutreachAdminStatus" AS ENUM ('NEEDS_RESPONSE', 'RESPONDED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "OutreachSuppressionReason" AS ENUM ('UNSUBSCRIBED', 'BOUNCED', 'COMPLAINT', 'ADMIN');

-- CreateTable
CREATE TABLE "RevenueEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "RevenueEventType" NOT NULL,
    "source" TEXT,
    "plan" TEXT,
    "interval" TEXT,
    "campaignId" TEXT,
    "outreachMessageId" TEXT,
    "stripeCustomerId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "stripeSubscriptionId" TEXT,
    "properties" JSONB,
    "idempotencyKey" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckoutAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "plan" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "campaignId" TEXT,
    "outreachMessageId" TEXT,
    "status" "CheckoutAttemptStatus" NOT NULL DEFAULT 'CLICKED',
    "stripeCheckoutSessionId" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "failureCategory" TEXT,
    "failureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),

    CONSTRAINT "CheckoutAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedStripeEvent" (
    "stripeEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedStripeEvent_pkey" PRIMARY KEY ("stripeEventId")
);

-- CreateTable
CREATE TABLE "OutreachCampaign" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "delayMinutes" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "transactional" BOOLEAN NOT NULL DEFAULT false,
    "subject" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "offerCode" TEXT,
    "dailySendCap" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "campaignId" TEXT NOT NULL,
    "occurrenceKey" TEXT NOT NULL,
    "status" "OutreachMessageStatus" NOT NULL DEFAULT 'QUEUED',
    "dryRun" BOOLEAN NOT NULL DEFAULT true,
    "replyToken" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "rfcMessageId" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastErrorCategory" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "lockedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "classification" "OutreachReplyClassification",
    "adminStatus" "OutreachAdminStatus" NOT NULL DEFAULT 'NEEDS_RESPONSE',
    "attributedSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachReply" (
    "id" TEXT NOT NULL,
    "outreachMessageId" TEXT NOT NULL,
    "mailbox" TEXT NOT NULL,
    "uidValidity" TEXT NOT NULL,
    "uid" INTEGER NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "bodyText" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "inReplyTo" TEXT,
    "references" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachSuppression" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reason" "OutreachSuppressionReason" NOT NULL,
    "sourceMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachSuppression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachMailboxCursor" (
    "mailbox" TEXT NOT NULL,
    "uidValidity" TEXT NOT NULL,
    "lastUid" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachMailboxCursor_pkey" PRIMARY KEY ("mailbox")
);

-- CreateIndex
CREATE UNIQUE INDEX "RevenueEvent_idempotencyKey_key" ON "RevenueEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "RevenueEvent_userId_occurredAt_idx" ON "RevenueEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "RevenueEvent_type_occurredAt_idx" ON "RevenueEvent"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "RevenueEvent_campaignId_occurredAt_idx" ON "RevenueEvent"("campaignId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutAttempt_stripeCheckoutSessionId_key" ON "CheckoutAttempt"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "CheckoutAttempt_userId_createdAt_idx" ON "CheckoutAttempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CheckoutAttempt_status_createdAt_idx" ON "CheckoutAttempt"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CheckoutAttempt_campaignId_createdAt_idx" ON "CheckoutAttempt"("campaignId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachCampaign_key_key" ON "OutreachCampaign"("key");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachMessage_replyToken_key" ON "OutreachMessage"("replyToken");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachMessage_rfcMessageId_key" ON "OutreachMessage"("rfcMessageId");

-- CreateIndex
CREATE INDEX "OutreachMessage_userId_createdAt_idx" ON "OutreachMessage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "OutreachMessage_status_scheduledAt_idx" ON "OutreachMessage"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "OutreachMessage_adminStatus_repliedAt_idx" ON "OutreachMessage"("adminStatus", "repliedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachMessage_campaignId_occurrenceKey_key" ON "OutreachMessage"("campaignId", "occurrenceKey");

-- CreateIndex
CREATE INDEX "OutreachReply_outreachMessageId_receivedAt_idx" ON "OutreachReply"("outreachMessageId", "receivedAt");

-- CreateIndex
CREATE INDEX "OutreachReply_receivedAt_idx" ON "OutreachReply"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachReply_mailbox_uidValidity_uid_key" ON "OutreachReply"("mailbox", "uidValidity", "uid");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachSuppression_email_key" ON "OutreachSuppression"("email");

-- AddForeignKey
ALTER TABLE "RevenueEvent" ADD CONSTRAINT "RevenueEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueEvent" ADD CONSTRAINT "RevenueEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "OutreachCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueEvent" ADD CONSTRAINT "RevenueEvent_outreachMessageId_fkey" FOREIGN KEY ("outreachMessageId") REFERENCES "OutreachMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutAttempt" ADD CONSTRAINT "CheckoutAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutAttempt" ADD CONSTRAINT "CheckoutAttempt_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "OutreachCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutAttempt" ADD CONSTRAINT "CheckoutAttempt_outreachMessageId_fkey" FOREIGN KEY ("outreachMessageId") REFERENCES "OutreachMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachMessage" ADD CONSTRAINT "OutreachMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachMessage" ADD CONSTRAINT "OutreachMessage_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "OutreachCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachReply" ADD CONSTRAINT "OutreachReply_outreachMessageId_fkey" FOREIGN KEY ("outreachMessageId") REFERENCES "OutreachMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
