-- AlterTable
ALTER TABLE "DataExport" ADD COLUMN     "handle" TEXT;

-- CreateIndex
CREATE INDEX "DataExport_userId_handle_idx" ON "DataExport"("userId", "handle");
