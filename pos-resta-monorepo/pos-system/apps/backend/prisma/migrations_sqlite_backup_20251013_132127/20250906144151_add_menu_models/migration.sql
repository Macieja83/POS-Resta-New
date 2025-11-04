/*
  Warnings:

  - You are about to drop the `addons` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `dish_sizes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `dishes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ingredients` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `modifiers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `isOnlineEnabled` on the `addon_groups` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `isDefault` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `isOnlineEnabled` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `vatRate` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `dishId` on the `group_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `isDefaultInCategory` on the `sizes` table. All the data in the column will be lost.
  - You are about to drop the column `isOnlineEnabled` on the `sizes` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "addons_isOnlineEnabled_idx";

-- DropIndex
DROP INDEX "addons_groupId_idx";

-- DropIndex
DROP INDEX "dish_sizes_dishId_sizeId_key";

-- DropIndex
DROP INDEX "dish_sizes_sizeId_idx";

-- DropIndex
DROP INDEX "dish_sizes_dishId_idx";

-- DropIndex
DROP INDEX "dishes_isOnlineEnabled_idx";

-- DropIndex
DROP INDEX "dishes_categoryId_idx";

-- DropIndex
DROP INDEX "ingredients_dishId_idx";

-- DropIndex
DROP INDEX "modifiers_groupId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "addons";
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
DROP TABLE "ingredients";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "modifiers";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "item_sizes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "sizeId" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "item_sizes_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "item_sizes_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "sizes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "addon_options" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "addon_options_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "addon_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_addon_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "minSelect" INTEGER NOT NULL DEFAULT 0,
    "maxSelect" INTEGER NOT NULL DEFAULT 1,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_addon_groups" ("createdAt", "id", "name", "position", "updatedAt") SELECT "createdAt", "id", "name", "position", "updatedAt" FROM "addon_groups";
DROP TABLE "addon_groups";
ALTER TABLE "new_addon_groups" RENAME TO "addon_groups";
CREATE INDEX "addon_groups_isOnline_idx" ON "addon_groups"("isOnline");
CREATE TABLE "new_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_categories" ("createdAt", "id", "name", "position", "updatedAt") SELECT "createdAt", "id", "name", "position", "updatedAt" FROM "categories";
DROP TABLE "categories";
ALTER TABLE "new_categories" RENAME TO "categories";
CREATE TABLE "new_group_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "itemId" TEXT,
    "categoryId" TEXT,
    "sizeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "group_assignments_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "addon_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_assignments_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_assignments_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_assignments_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "sizes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_group_assignments" ("categoryId", "createdAt", "groupId", "id", "sizeId", "updatedAt") SELECT "categoryId", "createdAt", "groupId", "id", "sizeId", "updatedAt" FROM "group_assignments";
DROP TABLE "group_assignments";
ALTER TABLE "new_group_assignments" RENAME TO "group_assignments";
CREATE INDEX "group_assignments_groupId_idx" ON "group_assignments"("groupId");
CREATE INDEX "group_assignments_itemId_idx" ON "group_assignments"("itemId");
CREATE INDEX "group_assignments_categoryId_idx" ON "group_assignments"("categoryId");
CREATE INDEX "group_assignments_sizeId_idx" ON "group_assignments"("sizeId");
CREATE TABLE "new_sizes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sizes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_sizes" ("categoryId", "createdAt", "id", "name", "position", "updatedAt") SELECT "categoryId", "createdAt", "id", "name", "position", "updatedAt" FROM "sizes";
DROP TABLE "sizes";
ALTER TABLE "new_sizes" RENAME TO "sizes";
CREATE INDEX "sizes_categoryId_idx" ON "sizes"("categoryId");
CREATE INDEX "sizes_isOnline_idx" ON "sizes"("isOnline");
CREATE UNIQUE INDEX "sizes_name_categoryId_key" ON "sizes"("name", "categoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "items_categoryId_idx" ON "items"("categoryId");

-- CreateIndex
CREATE INDEX "items_isOnline_idx" ON "items"("isOnline");

-- CreateIndex
CREATE INDEX "item_sizes_itemId_idx" ON "item_sizes"("itemId");

-- CreateIndex
CREATE INDEX "item_sizes_sizeId_idx" ON "item_sizes"("sizeId");

-- CreateIndex
CREATE UNIQUE INDEX "item_sizes_itemId_sizeId_key" ON "item_sizes"("itemId", "sizeId");

-- CreateIndex
CREATE INDEX "addon_options_groupId_idx" ON "addon_options"("groupId");

-- CreateIndex
CREATE INDEX "addon_options_isOnline_idx" ON "addon_options"("isOnline");
