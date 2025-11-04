/*
  Warnings:

  - You are about to drop the `addon_options` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `item_sizes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `isOnline` on the `addon_groups` table. All the data in the column will be lost.
  - You are about to drop the column `maxSelect` on the `addon_groups` table. All the data in the column will be lost.
  - You are about to drop the column `minSelect` on the `addon_groups` table. All the data in the column will be lost.
  - You are about to drop the column `itemId` on the `group_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `isDefault` on the `sizes` table. All the data in the column will be lost.
  - You are about to drop the column `isOnline` on the `sizes` table. All the data in the column will be lost.
  - Made the column `categoryId` on table `sizes` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "addon_options_isOnline_idx";

-- DropIndex
DROP INDEX "addon_options_groupId_idx";

-- DropIndex
DROP INDEX "item_sizes_itemId_sizeId_key";

-- DropIndex
DROP INDEX "item_sizes_sizeId_idx";

-- DropIndex
DROP INDEX "item_sizes_itemId_idx";

-- DropIndex
DROP INDEX "items_isOnline_idx";

-- DropIndex
DROP INDEX "items_categoryId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "addon_options";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "item_sizes";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "items";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "dishes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isOnlineEnabled" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "dishes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dish_sizes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dishId" TEXT NOT NULL,
    "sizeId" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "vatSource" TEXT NOT NULL DEFAULT 'inherit',
    "vatRateValue" REAL,
    "isOnlineEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "dish_sizes_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "dishes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dish_sizes_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "sizes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "addons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "isOnlineEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "addons_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "addon_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "modifiers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "selectionType" TEXT NOT NULL DEFAULT 'single',
    "minSelect" INTEGER NOT NULL DEFAULT 0,
    "maxSelect" INTEGER NOT NULL DEFAULT 1,
    "includedFreeQty" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "modifiers_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "addon_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dishId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ingredients_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "dishes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_addon_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isOnlineEnabled" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_addon_groups" ("createdAt", "id", "name", "position", "updatedAt") SELECT "createdAt", "id", "name", "position", "updatedAt" FROM "addon_groups";
DROP TABLE "addon_groups";
ALTER TABLE "new_addon_groups" RENAME TO "addon_groups";
CREATE INDEX "addon_groups_isOnlineEnabled_idx" ON "addon_groups"("isOnlineEnabled");
CREATE TABLE "new_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "vatRate" REAL NOT NULL DEFAULT 8.0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isOnlineEnabled" BOOLEAN NOT NULL DEFAULT true,
    "image" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_categories" ("createdAt", "id", "name", "position", "updatedAt") SELECT "createdAt", "id", "name", "position", "updatedAt" FROM "categories";
DROP TABLE "categories";
ALTER TABLE "new_categories" RENAME TO "categories";
CREATE INDEX "categories_isOnlineEnabled_idx" ON "categories"("isOnlineEnabled");
CREATE INDEX "categories_isDefault_idx" ON "categories"("isDefault");
CREATE TABLE "new_group_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "categoryId" TEXT,
    "dishId" TEXT,
    "sizeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "group_assignments_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "addon_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_assignments_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_assignments_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "dishes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_assignments_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "sizes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_group_assignments" ("categoryId", "createdAt", "groupId", "id", "sizeId", "updatedAt") SELECT "categoryId", "createdAt", "groupId", "id", "sizeId", "updatedAt" FROM "group_assignments";
DROP TABLE "group_assignments";
ALTER TABLE "new_group_assignments" RENAME TO "group_assignments";
CREATE INDEX "group_assignments_groupId_idx" ON "group_assignments"("groupId");
CREATE INDEX "group_assignments_categoryId_idx" ON "group_assignments"("categoryId");
CREATE INDEX "group_assignments_dishId_idx" ON "group_assignments"("dishId");
CREATE INDEX "group_assignments_sizeId_idx" ON "group_assignments"("sizeId");
CREATE TABLE "new_sizes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefaultInCategory" BOOLEAN NOT NULL DEFAULT false,
    "isOnlineEnabled" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sizes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_sizes" ("categoryId", "createdAt", "id", "name", "position", "updatedAt") SELECT "categoryId", "createdAt", "id", "name", "position", "updatedAt" FROM "sizes";
DROP TABLE "sizes";
ALTER TABLE "new_sizes" RENAME TO "sizes";
CREATE INDEX "sizes_categoryId_idx" ON "sizes"("categoryId");
CREATE INDEX "sizes_isOnlineEnabled_idx" ON "sizes"("isOnlineEnabled");
CREATE UNIQUE INDEX "sizes_name_categoryId_key" ON "sizes"("name", "categoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "dishes_categoryId_idx" ON "dishes"("categoryId");

-- CreateIndex
CREATE INDEX "dishes_isOnlineEnabled_idx" ON "dishes"("isOnlineEnabled");

-- CreateIndex
CREATE INDEX "dish_sizes_dishId_idx" ON "dish_sizes"("dishId");

-- CreateIndex
CREATE INDEX "dish_sizes_sizeId_idx" ON "dish_sizes"("sizeId");

-- CreateIndex
CREATE UNIQUE INDEX "dish_sizes_dishId_sizeId_key" ON "dish_sizes"("dishId", "sizeId");

-- CreateIndex
CREATE INDEX "addons_groupId_idx" ON "addons"("groupId");

-- CreateIndex
CREATE INDEX "addons_isOnlineEnabled_idx" ON "addons"("isOnlineEnabled");

-- CreateIndex
CREATE INDEX "modifiers_groupId_idx" ON "modifiers"("groupId");

-- CreateIndex
CREATE INDEX "ingredients_dishId_idx" ON "ingredients"("dishId");
