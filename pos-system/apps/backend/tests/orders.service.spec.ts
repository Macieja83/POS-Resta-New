import { describe, test, expect, beforeEach, vi } from 'vitest';
import { OrdersService } from '../src/services/orders.service';
import { OrdersRepository } from '../src/repos/orders.repo';
import { OrderStatus, OrderType } from '@pos-system/shared';
import { OrdersFiltersInput } from '../src/lib/validate';

// Mock the repository
const mockOrdersRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  updateStatus: vi.fn(),
  delete: vi.fn(),
  getOrdersWithGeo: vi.fn(),
};

describe('OrdersService', () => {
  let ordersService: OrdersService;

  beforeEach(() => {
    vi.clearAllMocks();
    ordersService = new OrdersService(mockOrdersRepository as any);
  });

  describe('getOrders', () => {
    test('should return orders with pagination and filtering', async () => {
      const mockOrders = [
        {
          id: '1',
          orderNumber: 'ORD-001',
          status: OrderStatus.OPEN,
          type: OrderType.DELIVERY,
          total: 2500,
          customer: { id: '1', name: 'John Doe', phone: '+48 123 456 789' },
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const mockResult = {
        orders: mockOrders,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockOrdersRepository.findAll.mockResolvedValue(mockResult);

      const filters: OrdersFiltersInput = {
        page: 1,
        limit: 20,
        status: OrderStatus.OPEN,
        type: OrderType.DELIVERY,
      };

      const result = await ordersService.getOrders(filters);

      expect(mockOrdersRepository.findAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockResult);
    });

    test('should handle search filters correctly', async () => {
      const mockResult = {
        orders: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockOrdersRepository.findAll.mockResolvedValue(mockResult);

      const filters: OrdersFiltersInput = {
        page: 1,
        limit: 10,
        search: 'John',
      };

      const result = await ordersService.getOrders(filters);

      expect(mockOrdersRepository.findAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockResult);
    });

    test('should handle date range filters correctly', async () => {
      const mockResult = {
        orders: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      mockOrdersRepository.findAll.mockResolvedValue(mockResult);

      const filters: OrdersFiltersInput = {
        page: 1,
        limit: 20,
        dateFrom: '2024-01-01T00:00:00Z',
        dateTo: '2024-01-31T23:59:59Z',
      };

      const result = await ordersService.getOrders(filters);

      expect(mockOrdersRepository.findAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockResult);
    });

    test('should handle pagination correctly', async () => {
      const mockResult = {
        orders: [],
        total: 100,
        page: 3,
        limit: 10,
        totalPages: 10,
      };

      mockOrdersRepository.findAll.mockResolvedValue(mockResult);

      const filters: OrdersFiltersInput = {
        page: 3,
        limit: 10,
      };

      const result = await ordersService.getOrders(filters);

      expect(mockOrdersRepository.findAll).toHaveBeenCalledWith(filters);
      expect(result.totalPages).toBe(10);
      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
    });

    test('should handle empty filters with defaults', async () => {
      const mockResult = {
        orders: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      mockOrdersRepository.findAll.mockResolvedValue(mockResult);

      const filters: OrdersFiltersInput = {};

      const result = await ordersService.getOrders(filters);

      expect(mockOrdersRepository.findAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getOrderById', () => {
    test('should return order when found', async () => {
      const mockOrder = {
        id: '1',
        orderNumber: 'ORD-001',
        status: OrderStatus.OPEN,
        type: OrderType.DELIVERY,
        total: 2500,
        customer: { id: '1', name: 'John Doe', phone: '+48 123 456 789' },
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockOrdersRepository.findById.mockResolvedValue(mockOrder);

      const result = await ordersService.getOrderById('1');

      expect(mockOrdersRepository.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockOrder);
    });

    test('should throw error when order not found', async () => {
      mockOrdersRepository.findById.mockResolvedValue(null);

      await expect(ordersService.getOrderById('non-existent')).rejects.toThrow(
        'Zamówienie o ID non-existent nie zostało znalezione'
      );

      expect(mockOrdersRepository.findById).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('createOrder', () => {
    test('should create order with valid data', async () => {
      const mockOrder = {
        id: '1',
        orderNumber: 'ORD-001',
        status: OrderStatus.OPEN,
        type: OrderType.DELIVERY,
        total: 4000,
        customer: { id: '1', name: 'John Doe', phone: '+48 123 456 789' },
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockOrdersRepository.create.mockResolvedValue(mockOrder);

      const orderData = {
        type: OrderType.DELIVERY,
        customer: {
          name: 'John Doe',
          phone: '+48 123 456 789',
          address: {
            street: 'Test Street',
            city: 'Test City',
            postalCode: '12-345',
          },
        },
        items: [
          {
            name: 'Pizza',
            quantity: 2,
            price: 2000,
          },
        ],
      };

      const result = await ordersService.createOrder(orderData);

      expect(mockOrdersRepository.create).toHaveBeenCalledWith(orderData);
      expect(result).toEqual(mockOrder);
    });

    test('should throw error for delivery order without address', async () => {
      const orderData = {
        type: OrderType.DELIVERY,
        customer: {
          name: 'John Doe',
          phone: '+48 123 456 789',
        },
        items: [
          {
            name: 'Pizza',
            quantity: 1,
            price: 2000,
          },
        ],
      };

      await expect(ordersService.createOrder(orderData)).rejects.toThrow(
        'Adres dostawy jest wymagany dla zamówień typu dostawa'
      );
    });

    test('should throw error for order without items', async () => {
      const orderData = {
        type: OrderType.TAKEAWAY,
        customer: {
          name: 'John Doe',
          phone: '+48 123 456 789',
        },
        items: [],
      };

      await expect(ordersService.createOrder(orderData)).rejects.toThrow(
        'Zamówienie musi zawierać przynajmniej jeden produkt'
      );
    });

    test('should throw error for item with invalid price', async () => {
      const orderData = {
        type: OrderType.TAKEAWAY,
        customer: {
          name: 'John Doe',
          phone: '+48 123 456 789',
        },
        items: [
          {
            name: 'Pizza',
            quantity: 1,
            price: 0,
          },
        ],
      };

      await expect(ordersService.createOrder(orderData)).rejects.toThrow(
        'Cena produktu "Pizza" musi być większa od 0'
      );
    });
  });

  describe('updateOrderStatus', () => {
    test('should update order status with valid transition', async () => {
      const existingOrder = {
        id: '1',
        orderNumber: 'ORD-001',
        status: OrderStatus.OPEN,
        type: OrderType.DELIVERY,
        total: 2500,
        customer: { id: '1', name: 'John Doe', phone: '+48 123 456 789' },
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedOrder = { ...existingOrder, status: OrderStatus.IN_PROGRESS };

      mockOrdersRepository.findById.mockResolvedValue(existingOrder);
      mockOrdersRepository.updateStatus.mockResolvedValue(updatedOrder);

      const result = await ordersService.updateOrderStatus('1', { status: OrderStatus.IN_PROGRESS });

      expect(mockOrdersRepository.findById).toHaveBeenCalledWith('1');
      expect(mockOrdersRepository.updateStatus).toHaveBeenCalledWith('1', OrderStatus.IN_PROGRESS);
      expect(result).toEqual(updatedOrder);
    });

    test('should throw error for invalid status transition', async () => {
      const existingOrder = {
        id: '1',
        orderNumber: 'ORD-001',
        status: OrderStatus.OPEN,
        type: OrderType.DELIVERY,
        total: 2500,
        customer: { id: '1', name: 'John Doe', phone: '+48 123 456 789' },
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockOrdersRepository.findById.mockResolvedValue(existingOrder);

      await expect(
        ordersService.updateOrderStatus('1', { status: OrderStatus.COMPLETED })
      ).rejects.toThrow('Nieprawidłowe przejście statusu z OPEN na COMPLETED');
    });
  });

  describe('deleteOrder', () => {
    test('should delete order when found', async () => {
      const existingOrder = {
        id: '1',
        orderNumber: 'ORD-001',
        status: OrderStatus.OPEN,
        type: OrderType.DELIVERY,
        total: 2500,
        customer: { id: '1', name: 'John Doe', phone: '+48 123 456 789' },
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockOrdersRepository.findById.mockResolvedValue(existingOrder);
      mockOrdersRepository.delete.mockResolvedValue(undefined);

      await ordersService.deleteOrder('1');

      expect(mockOrdersRepository.findById).toHaveBeenCalledWith('1');
      expect(mockOrdersRepository.delete).toHaveBeenCalledWith('1');
    });

    test('should throw error when order not found for deletion', async () => {
      mockOrdersRepository.findById.mockResolvedValue(null);

      await expect(ordersService.deleteOrder('non-existent')).rejects.toThrow(
        'Zamówienie o ID non-existent nie zostało znalezione'
      );
    });
  });

  describe('getOrdersWithGeo', () => {
    test('should return orders with geolocation data', async () => {
      const mockOrders = [
        {
          id: '1',
          orderNumber: 'ORD-001',
          status: OrderStatus.OPEN,
          type: OrderType.DELIVERY,
          total: 2500,
          customer: { id: '1', name: 'John Doe', phone: '+48 123 456 789' },
          delivery: {
            address: {
              latitude: 52.2297,
              longitude: 21.0122,
            },
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockOrdersRepository.getOrdersWithGeo.mockResolvedValue(mockOrders);

      const result = await ordersService.getOrdersWithGeo();

      expect(mockOrdersRepository.getOrdersWithGeo).toHaveBeenCalled();
      expect(result).toEqual(mockOrders);
    });
  });
});
