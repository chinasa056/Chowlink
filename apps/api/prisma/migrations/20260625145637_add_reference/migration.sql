/*
  Warnings:

  - A unique constraint covering the columns `[reference]` on the table `WalletTransaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reference` to the `WalletTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `wallettransaction` ADD COLUMN `reference` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `WalletTransaction_reference_key` ON `WalletTransaction`(`reference`);
