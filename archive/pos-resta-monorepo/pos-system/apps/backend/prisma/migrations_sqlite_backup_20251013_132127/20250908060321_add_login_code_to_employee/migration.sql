/*
  Warnings:

  - You are about to drop the `addon_groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `addon_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `dish_sizes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `dishes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `group_assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ingredients` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `modifiers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sizes` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[loginCode]` on the table `employees` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "employees" ADD COLUMN "loginCode" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "addon_groups";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "addon_items";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "categories";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "dish_sizes";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "dishes";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "group_assignments";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ingredients";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "modifiers";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "sizes";
PRAGMA foreign_keys=on;

-- CreateIndex
CREATE UNIQUE INDEX "employees_loginCode_key" ON "employees"("loginCode");

-- CreateIndex
CREATE INDEX "employees_loginCode_idx" ON "employees"("loginCode");
