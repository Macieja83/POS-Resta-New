-- Add performance indexes for better query performance

-- Index for orders by status and type (most common queries)
CREATE INDEX IF NOT EXISTS "idx_orders_status_type" ON "Order"("status", "type");

-- Index for orders by creation date (for date filtering)
CREATE INDEX IF NOT EXISTS "idx_orders_created_at" ON "Order"("createdAt");

-- Index for orders by assigned employee (for driver queries)
CREATE INDEX IF NOT EXISTS "idx_orders_assigned_employee" ON "Order"("assignedEmployeeId");

-- Index for orders by customer (for customer-related queries)
CREATE INDEX IF NOT EXISTS "idx_orders_customer" ON "Order"("customerId");

-- Index for orders by order number (for search)
CREATE INDEX IF NOT EXISTS "idx_orders_order_number" ON "Order"("orderNumber");

-- Index for delivery orders with geolocation
CREATE INDEX IF NOT EXISTS "idx_orders_delivery_geo" ON "Order"("type", "status") WHERE "type" = 'DELIVERY';

-- Index for order items by order (for item queries)
CREATE INDEX IF NOT EXISTS "idx_order_items_order" ON "OrderItem"("orderId");

-- Index for customers by name and phone (for search)
CREATE INDEX IF NOT EXISTS "idx_customers_name" ON "Customer"("name");
CREATE INDEX IF NOT EXISTS "idx_customers_phone" ON "Customer"("phone");

-- Index for addresses by coordinates (for map queries)
CREATE INDEX IF NOT EXISTS "idx_addresses_coordinates" ON "Address"("latitude", "longitude");

-- Index for employees by role (for driver queries)
CREATE INDEX IF NOT EXISTS "idx_employees_role" ON "Employee"("role");

-- Composite index for orders with multiple filters
CREATE INDEX IF NOT EXISTS "idx_orders_composite" ON "Order"("status", "type", "createdAt", "assignedEmployeeId");

