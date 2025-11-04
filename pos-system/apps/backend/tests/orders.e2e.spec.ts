import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from './setup';
import { OrderType, OrderStatus } from '@prisma/client';

const app = createApp();

describe('Orders API E2E Tests', () => {
  beforeEach(async () => {
    // Clean database before each test
    await prisma.orderItem.deleteMany();
    await prisma.delivery.deleteMany();
    await prisma.order.deleteMany();
    await prisma.address.deleteMany();
    await prisma.customer.deleteMany();
  });

  describe('GET /api/orders', () => {
    test('should return empty list when no orders exist', async () => {
      const response = await request(app)
        .get('/api/orders')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(0);
      expect(response.body.data.total).toBe(0);
      expect(response.body.data.totalPages).toBe(0);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(20);
    });

    test('should filter orders by status', async () => {
      // Create test data
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          phone: '+48 123 456 789',
        },
      });

      await prisma.order.create({
        data: {
          orderNumber: 'ORD-TEST-001',
          status: OrderStatus.OPEN,
          type: OrderType.DELIVERY,
          total: 2500,
          customerId: customer.id,
          items: {
            create: [
              {
                name: 'Test Product',
                quantity: 1,
                price: 2500,
                total: 2500,
              },
            ],
          },
        },
      });

      const response = await request(app)
        .get('/api/orders?status=OPEN')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].status).toBe(OrderStatus.OPEN);
      expect(response.body.data.totalPages).toBe(1);
    });

    test('should filter orders by type', async () => {
      // Create test data
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          phone: '+48 123 456 789',
        },
      });

      await prisma.order.create({
        data: {
          orderNumber: 'ORD-TEST-002',
          status: OrderStatus.OPEN,
          type: OrderType.TAKEAWAY,
          total: 1500,
          customerId: customer.id,
          items: {
            create: [
              {
                name: 'Test Product',
                quantity: 1,
                price: 1500,
                total: 1500,
              },
            ],
          },
        },
      });

      const response = await request(app)
        .get('/api/orders?type=TAKEAWAY')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].type).toBe(OrderType.TAKEAWAY);
    });

    test('should search orders by customer name', async () => {
      // Create test data
      const customer = await prisma.customer.create({
        data: {
          name: 'John Doe',
          phone: '+48 123 456 789',
        },
      });

      await prisma.order.create({
        data: {
          orderNumber: 'ORD-TEST-003',
          status: OrderStatus.OPEN,
          type: OrderType.DELIVERY,
          total: 3000,
          customerId: customer.id,
          items: {
            create: [
              {
                name: 'Test Product',
                quantity: 1,
                price: 3000,
                total: 3000,
              },
            ],
          },
        },
      });

      const response = await request(app)
        .get('/api/orders?search=John')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].customer.name).toBe('John Doe');
    });

    test('should search orders by customer phone', async () => {
      // Create test data
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          phone: '+48 987 654 321',
        },
      });

      await prisma.order.create({
        data: {
          orderNumber: 'ORD-TEST-004',
          status: OrderStatus.OPEN,
          type: OrderType.DELIVERY,
          total: 4000,
          customerId: customer.id,
          items: {
            create: [
              {
                name: 'Test Product',
                quantity: 1,
                price: 4000,
                total: 4000,
              },
            ],
          },
        },
      });

      const response = await request(app)
        .get('/api/orders?search=987')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].customer.phone).toBe('+48 987 654 321');
    });

    test('should search orders by order number', async () => {
      // Create test data
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          phone: '+48 123 456 789',
        },
      });

      await prisma.order.create({
        data: {
          orderNumber: 'ORD-SPECIAL-001',
          status: OrderStatus.OPEN,
          type: OrderType.DELIVERY,
          total: 5000,
          customerId: customer.id,
          items: {
            create: [
              {
                name: 'Test Product',
                quantity: 1,
                price: 5000,
                total: 5000,
              },
            ],
          },
        },
      });

      const response = await request(app)
        .get('/api/orders?search=SPECIAL')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].orderNumber).toBe('ORD-SPECIAL-001');
    });

    test('should filter orders by date range', async () => {
      // Create test data with specific dates
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          phone: '+48 123 456 789',
        },
      });

      const orderDate = new Date('2024-01-15T12:00:00Z');
      
      await prisma.order.create({
        data: {
          orderNumber: 'ORD-TEST-005',
          status: OrderStatus.OPEN,
          type: OrderType.DELIVERY,
          total: 6000,
          customerId: customer.id,
          createdAt: orderDate,
          items: {
            create: [
              {
                name: 'Test Product',
                quantity: 1,
                price: 6000,
                total: 6000,
              },
            ],
          },
        },
      });

      const response = await request(app)
        .get('/api/orders?dateFrom=2024-01-01T00:00:00Z&dateTo=2024-01-31T23:59:59Z')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].orderNumber).toBe('ORD-TEST-005');
    });

    test('should handle pagination correctly', async () => {
      // Create multiple test orders
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          phone: '+48 123 456 789',
        },
      });

      // Create 25 orders to test pagination
      for (let i = 1; i <= 25; i++) {
        await prisma.order.create({
          data: {
            orderNumber: `ORD-TEST-${i.toString().padStart(3, '0')}`,
            status: OrderStatus.OPEN,
            type: OrderType.DELIVERY,
            total: 1000 + i * 100,
            customerId: customer.id,
            items: {
              create: [
                {
                  name: `Test Product ${i}`,
                  quantity: 1,
                  price: 1000 + i * 100,
                  total: 1000 + i * 100,
                },
              ],
            },
          },
        });
      }

      // Test first page
      const firstPageResponse = await request(app)
        .get('/api/orders?page=1&limit=10')
        .expect(200);

      expect(firstPageResponse.body.success).toBe(true);
      expect(firstPageResponse.body.data.orders).toHaveLength(10);
      expect(firstPageResponse.body.data.page).toBe(1);
      expect(firstPageResponse.body.data.limit).toBe(10);
      expect(firstPageResponse.body.data.total).toBe(25);
      expect(firstPageResponse.body.data.totalPages).toBe(3);

      // Test second page
      const secondPageResponse = await request(app)
        .get('/api/orders?page=2&limit=10')
        .expect(200);

      expect(secondPageResponse.body.success).toBe(true);
      expect(secondPageResponse.body.data.orders).toHaveLength(10);
      expect(secondPageResponse.body.data.page).toBe(2);
      expect(secondPageResponse.body.data.limit).toBe(10);

      // Test third page
      const thirdPageResponse = await request(app)
        .get('/api/orders?page=3&limit=10')
        .expect(200);

      expect(thirdPageResponse.body.success).toBe(true);
      expect(thirdPageResponse.body.data.orders).toHaveLength(5); // Remaining 5 orders
      expect(thirdPageResponse.body.data.page).toBe(3);
    });

    test('should combine multiple filters', async () => {
      // Create test data
      const customer = await prisma.customer.create({
        data: {
          name: 'John Doe',
          phone: '+48 123 456 789',
        },
      });

      await prisma.order.create({
        data: {
          orderNumber: 'ORD-TEST-006',
          status: OrderStatus.OPEN,
          type: OrderType.DELIVERY,
          total: 7000,
          customerId: customer.id,
          items: {
            create: [
              {
                name: 'Test Product',
                quantity: 1,
                price: 7000,
                total: 7000,
              },
            ],
          },
        },
      });

      const response = await request(app)
        .get('/api/orders?status=OPEN&type=DELIVERY&search=John&page=1&limit=20')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].status).toBe(OrderStatus.OPEN);
      expect(response.body.data.orders[0].type).toBe(OrderType.DELIVERY);
      expect(response.body.data.orders[0].customer.name).toBe('John Doe');
    });

    test('should handle invalid query parameters gracefully', async () => {
      const response = await request(app)
        .get('/api/orders?page=0&limit=200')
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Validation error');
    });
  });

  describe('POST /api/orders', () => {
    test('should create order with valid data', async () => {
      const orderData = {
        type: OrderType.DELIVERY,
        customer: {
          name: 'John Doe',
          phone: '+48 987 654 321',
          address: {
            street: 'Test Street 123',
            city: 'Test City',
            postalCode: '12-345',
          },
        },
        items: [
          {
            name: 'Pizza Margherita',
            quantity: 2,
            price: 2000, // 20.00 zł in grosz
          },
        ],
        notes: 'Test order',
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orderNumber).toMatch(/^ORD-\d+-[A-Z0-9]+$/);
      expect(response.body.data.total).toBe(4000); // 2 * 2000 = 4000 grosz
      expect(response.body.data.customer.name).toBe('John Doe');
      expect(response.body.data.items).toHaveLength(1);
    });

    test('should return 422 for invalid data', async () => {
      const invalidOrderData = {
        type: OrderType.DELIVERY,
        customer: {
          name: '', // Invalid: empty name
          phone: '+48 123',
        },
        items: [], // Invalid: empty items
      };

      const response = await request(app)
        .post('/api/orders')
        .send(invalidOrderData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Validation error');
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    test('should update order status', async () => {
      // Create test order
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          phone: '+48 123 456 789',
        },
      });

      const order = await prisma.order.create({
        data: {
          orderNumber: 'ORD-TEST-002',
          status: OrderStatus.OPEN,
          type: OrderType.TAKEAWAY,
          total: 1500,
          customerId: customer.id,
          items: {
            create: [
              {
                name: 'Test Product',
                quantity: 1,
                price: 1500,
                total: 1500,
              },
            ],
          },
        },
      });

      const response = await request(app)
        .patch(`/api/orders/${order.id}/status`)
        .send({ status: OrderStatus.IN_PROGRESS })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(OrderStatus.IN_PROGRESS);
    });

    test('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .patch('/api/orders/non-existent-id/status')
        .send({ status: OrderStatus.IN_PROGRESS })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/orders/geo', () => {
    test('should return orders with geolocation data', async () => {
      // Create test data with address
      const address = await prisma.address.create({
        data: {
          street: 'Test Street 456',
          city: 'Test City',
          postalCode: '12-345',
          latitude: 54.4641,
          longitude: 17.0287,
        },
      });

      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          phone: '+48 123 456 789',
        },
      });

      await prisma.order.create({
        data: {
          orderNumber: 'ORD-TEST-003',
          status: OrderStatus.OPEN,
          type: OrderType.DELIVERY,
          total: 3000,
          customerId: customer.id,
          items: {
            create: [
              {
                name: 'Test Product',
                quantity: 1,
                price: 3000,
                total: 3000,
              },
            ],
          },
          delivery: {
            create: {
              addressId: address.id,
            },
          },
        },
      });

      const response = await request(app)
        .get('/api/orders/geo')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].delivery.address.latitude).toBe(54.4641);
      expect(response.body.data[0].delivery.address.longitude).toBe(17.0287);
    });
  });
});

