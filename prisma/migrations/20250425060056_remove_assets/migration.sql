/*
  Warnings:

  - You are about to drop the `asset` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `asset` DROP FOREIGN KEY `Asset_projectId_fkey`;

-- DropTable
DROP TABLE `asset`;
