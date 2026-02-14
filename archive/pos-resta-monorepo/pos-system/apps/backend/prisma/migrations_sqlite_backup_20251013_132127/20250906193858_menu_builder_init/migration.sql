/*
  Warnings:

  - You are about to drop the `addon_options` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `item_sizes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `maxSelect` on the `addon_groups` table. All the data in the column will be lost.
  - You are about to drop the column `minSelect` on the `addon_groups` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `addon_groups` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `itemId` on the `group_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `sizeId` on the `group_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `isDefault` on the `sizes` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `sizes` table. All the data in the column will be lost.
  - Added the required column `vatRate` to the `categories` table without a default value. This is not possible if the table is not empty.
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
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "dishes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dish_sizes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dishId" TEXT NOT NULL,
    "sizeId" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "vatSource" TEXT NOT NULL DEFAULT 'INHERIT',
    "vatOverride" REAL,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "dish_sizes_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "dishes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dish_sizes_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "sizes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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

-- CreateTable
CREATE TABLE "addon_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL DEFAULT 0,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "addon_items_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "addon_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "modifiers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "selectionType" TEXT NOT NULL DEFAULT 'MULTI',
    "minSelect" INTEGER NOT NULL DEFAULT 0,
    "maxSelect" INTEGER,
    "includedFreeQty" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "modifiers_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "addon_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_addon_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_addon_groups" ("createdAt", "id", "isOnline", "name", "updatedAt") SELECT "createdAt", "id", "isOnline", "name", "updatedAt" FROM "addon_groups";
DROP TABLE "addon_groups";
ALTER TABLE "new_addon_groups" RENAME TO "addon_groups";
CREATE INDEX "addon_groups_name_idx" ON "addon_groups"("name");
CREATE TABLE "new_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "vatRate" REAL NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_categories" ("createdAt", "id", "name", "updatedAt") SELECT "createdAt", "id", "name", "updatedAt" FROM "categories";
DROP TABLE "categories";
ALTER TABLE "new_categories" RENAME TO "categories";
CREATE INDEX "categories_name_idx" ON "categories"("name");
CREATE TABLE "new_group_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "categoryId" TEXT,
    "dishId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "group_assignments_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "addon_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_assignments_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_assignments_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "dishes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_group_assignments" ("categoryId", "createdAt", "groupId", "id", "updatedAt") SELECT "categoryId", "createdAt", "groupId", "id", "updatedAt" FROM "group_assignments";
DROP TABLE "group_assignments";
ALTER TABLE "new_group_assignments" RENAME TO "group_assignments";
CREATE TABLE "new_sizes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefaultInCategory" BOOLEAN NOT NULL DEFAULT false,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sizes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_sizes" ("categoryId", "createdAt", "id", "isOnline", "name", "updatedAt") SELECT "categoryId", "createdAt", "id", "isOnline", "name", "updatedAt" FROM "sizes";
DROP TABLE "sizes";
ALTER TABLE "new_sizes" RENAME TO "sizes";
CREATE UNIQUE INDEX "sizes_categoryId_name_key" ON "sizes"("categoryId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "dishes_categoryId_name_idx" ON "dishes"("categoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "dish_sizes_dishId_sizeId_key" ON "dish_sizes"("dishId", "sizeId");

-- CreateIndex
CREATE INDEX "addon_items_groupId_sortOrder_idx" ON "addon_items"("groupId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "modifiers_groupId_key" ON "modifiers"("groupId");
