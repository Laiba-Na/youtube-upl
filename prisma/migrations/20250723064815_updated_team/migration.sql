/*
  Warnings:

  - You are about to alter the column `role` on the `teammember` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.

*/
-- DropForeignKey
ALTER TABLE `teammember` DROP FOREIGN KEY `TeamMember_teamId_fkey`;

-- DropForeignKey
ALTER TABLE `teammember` DROP FOREIGN KEY `TeamMember_userId_fkey`;

-- DropIndex
DROP INDEX `TeamMember_teamId_fkey` ON `teammember`;

-- AlterTable
ALTER TABLE `team` ADD COLUMN `description` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `teammember` MODIFY `role` ENUM('ADMIN', 'POST_SCHEDULER', 'POST_CREATOR', 'ANALYTICS', 'MEMBER') NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE `user` ADD COLUMN `userType` ENUM('INDIVIDUAL', 'TEAM_MEMBER') NOT NULL DEFAULT 'INDIVIDUAL';

-- AddForeignKey
ALTER TABLE `TeamMember` ADD CONSTRAINT `TeamMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamMember` ADD CONSTRAINT `TeamMember_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
