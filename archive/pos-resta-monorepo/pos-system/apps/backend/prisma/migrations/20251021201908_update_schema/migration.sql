-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "addedIngredients" JSONB,
ADD COLUMN     "addons" JSONB,
ADD COLUMN     "ingredients" JSONB,
ADD COLUMN     "isHalfHalf" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "leftHalf" JSONB,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "removedIngredients" JSONB,
ADD COLUMN     "rightHalf" JSONB,
ADD COLUMN     "selectedSize" JSONB;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "completedById" TEXT,
ADD COLUMN     "paymentMethod" TEXT;

-- CreateTable
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "orders_completedById_idx" ON "orders"("completedById");

-- CreateIndex
CREATE INDEX "orders_type_idx" ON "orders"("type");

-- CreateIndex
CREATE INDEX "orders_status_type_idx" ON "orders"("status", "type");

-- CreateIndex
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt");

-- CreateIndex
CREATE INDEX "orders_status_type_createdAt_idx" ON "orders"("status", "type", "createdAt");

-- CreateIndex
CREATE INDEX "orders_assignedEmployeeId_status_idx" ON "orders"("assignedEmployeeId", "status");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
