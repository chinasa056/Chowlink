/*
  Warnings:

  - You are about to drop the column `chowdeckDeliveryId` on the `delivery` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[providerDeliveryId]` on the table `Delivery` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[providerReference]` on the table `Delivery` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `provider` to the `Delivery` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Delivery_chowdeckDeliveryId_key` ON `delivery`;

-- AlterTable
ALTER TABLE `delivery` DROP COLUMN `chowdeckDeliveryId`,
    ADD COLUMN `deliveryFee` INTEGER NULL,
    ADD COLUMN `provider` ENUM('CHOWDECK') NOT NULL,
    ADD COLUMN `providerDeliveryId` VARCHAR(191) NULL,
    ADD COLUMN `providerReference` VARCHAR(191) NULL,
    ADD COLUMN `trackingUrl` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Address` (
    `id` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `label` VARCHAR(191) NULL,
    `organizationId` VARCHAR(191) NULL,
    `restaurantId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Delivery_providerDeliveryId_key` ON `Delivery`(`providerDeliveryId`);

-- CreateIndex
CREATE UNIQUE INDEX `Delivery_providerReference_key` ON `Delivery`(`providerReference`);
