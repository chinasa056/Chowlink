/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `delivery` ADD COLUMN `redeliveryCount` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `order` ADD COLUMN `aggregatedAt` DATETIME(3) NULL,
    ADD COLUMN `cancelledAt` DATETIME(3) NULL,
    ADD COLUMN `completedAt` DATETIME(3) NULL,
    ADD COLUMN `dispatchedAt` DATETIME(3) NULL,
    ADD COLUMN `idempotencyKey` VARCHAR(191) NULL,
    ADD COLUMN `orderBatchId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `outboxevent` ADD COLUMN `processedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `OrderBatch` (
    `id` VARCHAR(191) NOT NULL,
    `restaurantId` VARCHAR(191) NOT NULL,
    `dispatchDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Order_idempotencyKey_key` ON `Order`(`idempotencyKey`);

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_orderBatchId_fkey` FOREIGN KEY (`orderBatchId`) REFERENCES `OrderBatch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
