-- AlterTable
ALTER TABLE `googleaccount` ADD COLUMN `accessToken` VARCHAR(191) NULL,
    ADD COLUMN `expiresAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `post` ADD COLUMN `scheduledAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `analyticsEmails` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `darkMode` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `emailNotifications` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `profileImage` VARCHAR(191) NULL,
    ADD COLUMN `timezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Karachi';

-- CreateTable
CREATE TABLE `SocialPost` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `content` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `scheduledAt` DATETIME(3) NOT NULL,
    `mediaUrl` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SocialPost` ADD CONSTRAINT `SocialPost_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
