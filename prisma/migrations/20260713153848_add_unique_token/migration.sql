/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `EmailVerificationToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");
