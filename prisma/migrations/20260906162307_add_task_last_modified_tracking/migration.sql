-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "lastModifiedAt" TIMESTAMP(3),
ADD COLUMN     "lastModifiedBy" TEXT;
