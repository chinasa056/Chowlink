/*
  Warnings:

  - Added the required column `phone` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Restaurant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `delivery` ADD COLUMN `cancelReason` VARCHAR(191) NULL,
    ADD COLUMN `cancelledAt` DATETIME(3) NULL,
    MODIFY `status` ENUM('PENDING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `organization` ADD COLUMN `phone` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `restaurant` ADD COLUMN `phone` VARCHAR(191) NOT NULL;
