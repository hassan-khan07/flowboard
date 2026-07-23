/*
  Warnings:

  - A unique constraint covering the columns `[email,workspaceId]` on the table `InviteToken` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "InviteToken" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'MEMBER';

-- CreateIndex
CREATE UNIQUE INDEX "InviteToken_email_workspaceId_key" ON "InviteToken"("email", "workspaceId");
