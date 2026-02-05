import { NextFunction, Request, Response } from 'express';
import { createOrderSchema, ordersFiltersSchema, updateOrderSchema, updateOrderStatusSchema, validateInput } from '../lib/validate';
import { OrdersService } from '../services/orders.service';
import {
    OrderSummaryFilters,
    OrdersFiltersInput,
    OrderType,
    UpdateOrderStatusInput
} from '../types/local';

// Local types for controller
type CreateOrderRequest = any; // Will be defined by Prisma
type AssignEmployeeRequest = {
  employeeId: string;
};

export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('getOrders called with query:', req.query);
      
      // Parse and validate query parameters
      const filters = ordersFiltersSchema.parse(req.query);
      console.log('Validated filters:', filters);
      
      const result = await this.ordersService.getOrders({
        ...filters,
        page: filters.page || 1,
        limit: filters.limit || 15 // Further reduced limit for faster loading
      } as OrdersFiltersInput);
      
      // Add cache headers for better performance
      res.set({
        'Cache-Control': 'public, max-age=30', // Cache przez 30 sekund
        'ETag': `"${Date.now()}"`, // ETag dla cache validation
        'Vary': 'Accept-Encoding' // Enable compression
      });
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getOrders:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      next(error);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await this.ordersService.getOrderById(id);
      
      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('createOrder called with body:', JSON.stringify(req.body, null, 2));
      
      const orderData = validateInput(createOrderSchema, req.body);
      console.log('Validated orderData:', JSON.stringify(orderData, null, 2));
      
      const newOrder = await this.ordersService.createOrder(orderData);
      
      res.status(201).json({
        success: true,
        data: newOrder
      });
    } catch (error) {
      console.error('Error in createOrder:', error);
      next(error);
    }
  }

  async createPublicOrder(req: Request, res: Response, next: NextFunction) {
    try {
      // Enhanced validation for public orders
      const { 
        type, 
        items, 
        customer, 
        tableNumber, 
        notes, 
        promisedTime
      } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Zamówienie musi zawierać przynajmniej jedną pozycję'
        });
      }

      // Validate that prices are positive numbers
      for (const item of items) {
        if (typeof item.price !== 'number' || item.price <= 0) {
          return res.status(400).json({
            success: false,
            error: `Cena produktu "${item.name}" musi być liczbą dodatnią`
          });
        }
      }

      // Validate customer data
      if (!customer || !customer.name || !customer.phone) {
        return res.status(400).json({
          success: false,
          error: 'Imię, nazwisko i numer telefonu są wymagane'
        });
      }

      // Validate order type specific fields
      if (type === 'DINE_IN' && !tableNumber) {
        return res.status(400).json({
          success: false,
          error: 'Numer stolika jest wymagany dla zamówień na miejscu'
        });
      }

      // Create order data
      const orderData: CreateOrderRequest & { status?: string } = {
        type: type || OrderType.DINE_IN,
        status: 'PENDING',
        items: items,
        customer: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email || ''
        },
        tableNumber: type === 'DINE_IN' ? tableNumber : '',
        notes: notes || `Zamówienie ${type === 'DINE_IN' ? 'na miejscu' : 'na wynos'} z QR kodu`,
        promisedTime: promisedTime || 30
      };

      const newOrder = await this.ordersService.createOrder(orderData);
      
      res.status(201).json({
        success: true,
        data: newOrder,
        message: 'Zamówienie zostało złożone pomyślnie!'
      });
    } catch (error) {
      next(error);
    }
  }

  // Employee app endpoints
  async getAvailableOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit = 20, page = 1 } = req.query;
      
      // EXTENSIVE LOGGING FOR DEBUGGING
      console.log('========================================');
      console.log('📦 getAvailableOrders CALLED!');
      console.log('   Method:', req.method);
      console.log('   URL:', req.url);
      console.log('   Origin:', req.get('Origin'));
      console.log('   User-Agent:', req.get('User-Agent'));
      console.log('   Query params:', { limit, page });
      console.log('   Headers:', JSON.stringify(req.headers, null, 2));
      console.log('========================================');
      
      // Get orders with status OPEN, PENDING, or READY (new orders available for assignment)
      // Only show DELIVERY orders for drivers
      // Only show orders that are NOT assigned to any employee (available for claiming)
      const filters = {
        limit: Number(limit),
        page: Number(page),
        status: ['OPEN', 'PENDING', 'READY'] as any,
        type: 'DELIVERY' as any,
        assignedEmployeeId: null as any // Only unassigned orders
      };

      console.log('📦 Fetching orders with filters:', filters);
      const orders = await this.ordersService.getOrders(filters);
      
      console.log('📦 Found orders:', orders.orders.length, 'out of', orders.total);
      console.log('📦 Order IDs:', orders.orders.map((o: any) => o.id).slice(0, 5));
      
      const response = {
        success: true,
        data: orders.orders,
        pagination: {
          limit: Number(limit),
          page: Number(page),
          hasMore: Number(page) < orders.totalPages,
          total: orders.total
        }
      };
      
      console.log('📦 Sending response with', response.data.length, 'orders');
      console.log('📦 Response structure:', {
        success: response.success,
        dataLength: response.data.length,
        pagination: response.pagination
      });
      console.log('========================================');
      
      res.json(response);
    } catch (error) {
      console.error('❌ Error in getAvailableOrders:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
      next(error);
    }
  }

  async getMyOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit = 20, page = 1 } = req.query;
      const employeeId = (req as any).user?.id; // Assuming auth middleware sets req.user
      
      console.log('🔵 [getMyOrders] Request received:', {
        employeeId,
        limit,
        page,
        hasUser: !!(req as any).user
      });
      
      if (!employeeId) {
        console.error('❌ [getMyOrders] No employee ID in request');
        return res.status(401).json({
          success: false,
          error: 'Brak autoryzacji'
        });
      }

      // Get all orders assigned to this employee, regardless of type
      // This allows drivers and employees to see all their assigned orders
      const filters = {
        limit: Number(limit),
        page: Number(page),
        assignedEmployeeId: employeeId,
        // Removed type filter to show all assigned orders (DELIVERY, TAKEAWAY, DINE_IN)
      };

      console.log('🔵 [getMyOrders] Fetching orders with filters:', filters);
      const orders = await this.ordersService.getOrders(filters);
      console.log(`✅ [getMyOrders] Found ${orders.orders.length} orders for employee ${employeeId}`);
      
      res.json({
        success: true,
        data: orders.orders,
        pagination: {
          limit: Number(limit),
          page: Number(page),
          hasMore: Number(page) < orders.totalPages,
          total: orders.total
        }
      });
    } catch (error) {
      console.error('❌ [getMyOrders] Error:', error);
      next(error);
    }
  }

  async claimOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const employeeId = (req as any).user?.id; // Assuming auth middleware sets req.user
      const employeeRole = (req as any).user?.role;
      
      console.log('🔵 [claimOrder] Request received:', {
        orderId: id,
        employeeId,
        employeeRole,
        hasUser: !!(req as any).user
      });
      
      if (!employeeId) {
        console.error('❌ [claimOrder] No employee ID in request');
        return res.status(401).json({
          success: false,
          error: 'Brak autoryzacji'
        });
      }

      console.log('🔵 [claimOrder] Attempting to assign order...');
      const order = await this.ordersService.assignEmployee(id, employeeId);
      console.log('✅ [claimOrder] Order assigned successfully');
      
      res.json({
        success: true,
        data: order
      });
    } catch (error: any) {
      console.error('❌ [claimOrder] Error:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      // Return more detailed error message
      if (error?.message) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as any).user; // Get user from auth middleware (optional)
      console.log('🔄 updateOrderStatus called:', { 
        id, 
        body: req.body, 
        userId: user?.id,
        hasPaymentMethod: !!req.body.paymentMethod,
        paymentMethodValue: req.body.paymentMethod
      });
      
      const statusData = validateInput(updateOrderStatusSchema, req.body);
      console.log('✅ Validated statusData:', {
        status: statusData.status,
        paymentMethod: statusData.paymentMethod,
        hasStatus: !!statusData.status,
        hasPaymentMethod: !!statusData.paymentMethod
      });
      
      // status and/or paymentMethod can be provided
      if (!statusData.status && !statusData.paymentMethod) {
        return res.status(400).json({
          success: false,
          error: 'Either status or paymentMethod is required'
        });
      }
      
      // If user is authenticated and order is being completed, set completedById
      // This ensures that completed orders are properly tracked for empapp users
      if (user?.id && statusData.status) {
        const completedStatuses = ['COMPLETED', 'DELIVERED'];
        if (completedStatuses.includes(statusData.status)) {
          statusData.completedBy = {
            id: user.id,
            name: user.name || '',
            role: user.role || 'DRIVER'
          };
        }
      }
      
      // Ensure paymentMethod is always passed through if provided (cast: validated role may be inferred as unknown by TS)
      const order = await this.ordersService.updateOrderStatus(id, statusData as UpdateOrderStatusInput, user?.id);
      
      console.log('✅ Order status updated successfully:', {
        orderId: id,
        finalStatus: order.status,
        finalPaymentMethod: order.paymentMethod,
        completedById: (order as any).completedById
      });
      
      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('❌ Error in updateOrderStatus:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      next(error);
    }
  }

  async updateOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      console.log('updateOrder called with:', { id, body: req.body });
      console.log('Request body keys:', Object.keys(req.body));
      console.log('Request body type:', typeof req.body);
      console.log('Request body type field:', req.body.type);
      console.log('Request body customer field:', req.body.customer);
      console.log('Request body items field:', req.body.items);
      
      const orderData = validateInput(updateOrderSchema, req.body);
      console.log('Validated orderData:', orderData);
      
      const order = await this.ordersService.updateOrder(id, orderData);
      
      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Error in updateOrder:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : undefined);
      next(error);
    }
  }

  async deleteOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.ordersService.deleteOrder(id);
      
      res.json({
        success: true,
        message: 'Zamówienie zostało usunięte',
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrdersWithGeo(_req: Request, res: Response, next: NextFunction) {
    try {
      const ordersWithGeo = await this.ordersService.getOrdersWithGeo();
      
      res.json({
        success: true,
        data: ordersWithGeo
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrdersForMap(_req: Request, res: Response, next: NextFunction) {
    try {
      console.log('getOrdersForMap called');
      const result = await this.ordersService.getOrdersForMap();
      
      // Dodaj cache headers dla lepszej wydajności
      res.set({
        'Cache-Control': 'public, max-age=15', // Cache przez 15 sekund
        'ETag': `"${Date.now()}"` // ETag dla cache validation
      });
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getOrdersForMap:', error);
      next(error);
    }
  }

  async getOrderSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: OrderSummaryFilters = {
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        employeeId: req.query.employeeId as string,
        restaurantId: req.query.restaurantId as string,
      };
      
      const summary = await this.ordersService.getOrderSummary(filters);
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }

  async assignEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { employeeId }: AssignEmployeeRequest = req.body;
      
      console.log('assignEmployee called with:', { id, employeeId });
      
      const order = await this.ordersService.assignEmployee(id, employeeId);
      
      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Error in assignEmployee:', error);
      next(error);
    }
  }

  async unassignEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const order = await this.ordersService.unassignEmployee(id);
      
      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  async restoreOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await this.ordersService.restoreOrder(id);
      
      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  async setTestStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const order = await this.ordersService.setTestStatus(id, status);
      
      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  // Restaurant-shop adapter - creates order from shop format and maps statuses
  async createOrderFromShop(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('createOrderFromShop called with body:', JSON.stringify(req.body, null, 2));
      
      const shopOrder = req.body;
      
      // Map restaurant-shop order type to POS type
      const typeMap: Record<string, string> = {
        'DELIVERY': 'DELIVERY',
        'PICKUP': 'TAKEAWAY',
        'DINE_IN': 'DINE_IN'
      };
      
      // Transform CreateOrderRequest format to POS format
      const posOrderData = {
        type: typeMap[shopOrder.type] || 'DELIVERY',
        status: 'PENDING', // New orders from shop require acceptance in POS before processing
        customer: shopOrder.customer || {
          name: 'Customer',
          phone: '',
          email: ''
        },
        items: shopOrder.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          addons: item.addons || [],
          ingredients: item.ingredients || [],
          addedIngredients: item.addedIngredients || [],
          removedIngredients: item.removedIngredients || [],
          isHalfHalf: item.isHalfHalf || false,
          selectedSize: item.selectedSize || null,
          leftHalf: item.leftHalf || null,
          rightHalf: item.rightHalf || null,
          notes: item.notes || null
        })),
        notes: shopOrder.notes || null,
        tableNumber: shopOrder.tableNumber || null,
        promisedTime: shopOrder.promisedTime || 30
      };
      
      console.log('Transformed to POS format:', JSON.stringify(posOrderData, null, 2));
      
      const newOrder = await this.ordersService.createOrder(posOrderData);
      
      res.status(201).json({
        success: true,
        data: newOrder,
        message: 'Order created successfully from shop'
      });
    } catch (error) {
      console.error('Error in createOrderFromShop:', error);
      next(error);
    }
  }

  // EMPAPP specific methods
  async getOrderHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      
      if (!user || !user.id) {
        return res.status(401).json({
          success: false,
          error: 'Brak autoryzacji'
        });
      }
      
      const { limit = 100, page = 1 } = req.query;
      
      console.log('📋 Getting order history for user:', user.id);
      
      // Get completed orders for this driver (use HISTORICAL to get COMPLETED and CANCELLED)
      const filters = {
        limit: Number(limit) * 2, // Get more to filter, then limit
        page: Number(page),
        assignedEmployeeId: user.id,
        status: 'HISTORICAL' as any // This will get COMPLETED and CANCELLED orders
      };

      let orders;
      try {
        orders = await this.ordersService.getOrders(filters);
        console.log('📋 getOrders response structure (history):', {
          hasOrders: !!orders,
          hasOrdersOrders: !!orders?.orders,
          ordersType: typeof orders,
          ordersKeys: orders ? Object.keys(orders) : []
        });
      } catch (error: any) {
        console.error('❌ Error calling getOrders for history:', {
          message: error?.message,
          stack: error?.stack
        });
        throw error;
      }
      
      // Ensure orders.orders is an array
      if (!orders || !Array.isArray(orders.orders)) {
        console.error('❌ orders.orders is not an array (history):', {
          orders: !!orders,
          ordersOrders: !!orders?.orders,
          ordersOrdersType: typeof orders?.orders,
          ordersStructure: orders
        });
        return res.status(500).json({
          success: false,
          error: 'Invalid data format from database',
          details: 'orders.orders is not an array'
        });
      }
      
      console.log('📋 Raw orders from database (history):', {
        total: orders.orders.length,
        sample: orders.orders.slice(0, 5).map((o: any) => ({
          orderNumber: o?.orderNumber || 'N/A',
          status: o?.status || 'N/A',
          paymentMethod: o?.paymentMethod || 'N/A',
          total: o?.total || 0,
          assignedEmployeeId: o?.assignedEmployeeId || 'N/A'
        }))
      });
      
      // Filter: Only include orders that have payment method (finalized orders)
      // These are orders that were delivered and payment was collected
      // Include CASH, CARD, and PAID (zapłacone)
      const finalizedOrders = orders.orders.filter((o: any) => {
        if (!o) return false;
        const hasPayment = o.paymentMethod === 'CASH' || o.paymentMethod === 'CARD' || o.paymentMethod === 'PAID';
        if (!hasPayment) {
          console.log('⚠️ History: Order without payment method:', {
            orderNumber: o?.orderNumber || 'N/A',
            status: o?.status || 'N/A',
            paymentMethod: o?.paymentMethod || null
          });
        }
        return hasPayment;
      });
      
      console.log('📋 Finalized orders (history, with payment):', {
        count: finalizedOrders.length,
        sample: finalizedOrders.slice(0, 5).map((o: any) => ({
          orderNumber: o?.orderNumber || 'N/A',
          status: o?.status || 'N/A',
          paymentMethod: o?.paymentMethod || 'N/A',
          total: o?.total || 0
        }))
      });
      
      // Apply pagination to filtered results
      const startIndex = Math.max(0, (Number(page) - 1) * Number(limit));
      const endIndex = startIndex + Number(limit);
      const paginatedOrders = Array.isArray(finalizedOrders) 
        ? finalizedOrders.slice(startIndex, endIndex)
        : [];
      
      const totalFinalized = finalizedOrders.length;
      const totalPages = Math.ceil(totalFinalized / Number(limit));
      
      console.log('📋 Found orders for history:', {
        total: orders.orders.length,
        finalized: finalizedOrders.length,
        paginated: paginatedOrders.length,
        page: Number(page),
        totalPages,
        cashCount: finalizedOrders.filter((o: any) => o?.paymentMethod === 'CASH').length,
        cardCount: finalizedOrders.filter((o: any) => o?.paymentMethod === 'CARD').length,
        paidCount: finalizedOrders.filter((o: any) => o?.paymentMethod === 'PAID').length
      });
      
      res.json({
        success: true,
        data: paginatedOrders,
        pagination: {
          limit: Number(limit),
          page: Number(page),
          hasMore: Number(page) < totalPages,
          total: totalFinalized
        }
      });
    } catch (error: any) {
      console.error('❌ Error getting order history:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        name: error?.name
      });
      next(error);
    }
  }

  async getPaymentStats(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      
      console.log('📊 getPaymentStats called, user:', user?.id || 'no user');
      
      // If no user (auth disabled), return empty stats
      if (!user || !user.id) {
        return res.json({
          success: true,
          data: {
            totalOrders: 0,
            totalAmount: 0,
            paymentMethods: {},
            averageOrderValue: 0
          }
        });
      }
      
      // Get completed orders for this driver (with payment method - these are finalized orders)
      // We want orders that have paymentMethod set, which means they were finalized
      // Typically these should be COMPLETED, but we also check DELIVERED with payment method
      const filters = {
        limit: 1000,
        page: 1,
        assignedEmployeeId: user.id,
        status: 'HISTORICAL' as any // This gets COMPLETED and CANCELLED
      };

      let orders;
      try {
        orders = await this.ordersService.getOrders(filters);
        console.log('📊 getOrders response structure (stats):', {
          hasOrders: !!orders,
          hasOrdersOrders: !!orders?.orders,
          ordersType: typeof orders,
          ordersKeys: orders ? Object.keys(orders) : []
        });
      } catch (error: any) {
        console.error('❌ Error calling getOrders for stats:', {
          message: error?.message,
          stack: error?.stack
        });
        throw error;
      }
      
      // Ensure orders.orders is an array
      if (!orders || !Array.isArray(orders.orders)) {
        console.error('❌ orders.orders is not an array (stats):', {
          orders: !!orders,
          ordersOrders: !!orders?.orders,
          ordersOrdersType: typeof orders?.orders,
          ordersStructure: orders
        });
        return res.status(500).json({
          success: false,
          error: 'Invalid data format from database',
          details: 'orders.orders is not an array'
        });
      }
      
      console.log('📊 Raw orders from database:', {
        total: orders.orders.length,
        sample: orders.orders.slice(0, 5).map((o: any) => ({
          orderNumber: o?.orderNumber || 'N/A',
          status: o?.status || 'N/A',
          paymentMethod: o?.paymentMethod || 'N/A',
          total: o?.total || 0,
          assignedEmployeeId: o?.assignedEmployeeId || 'N/A'
        }))
      });
      
      // Filter: Only orders that have payment method (finalized orders)
      // These are orders that were delivered and payment was collected
      // Include CASH, CARD, and PAID (zapłacone)
      const finalizedOrders = orders.orders.filter((o: any) => {
        if (!o) return false;
        // Include orders with payment method (CASH, CARD, or PAID)
        // These are orders that were completed with payment
        const hasPayment = o.paymentMethod === 'CASH' || o.paymentMethod === 'CARD' || o.paymentMethod === 'PAID';
        if (!hasPayment) {
          console.log('⚠️ Order without payment method:', {
            orderNumber: o?.orderNumber || 'N/A',
            status: o?.status || 'N/A',
            paymentMethod: o?.paymentMethod || null
          });
        }
        return hasPayment;
      });
      
      console.log('📊 Finalized orders (with payment):', {
        count: finalizedOrders.length,
        sample: finalizedOrders.slice(0, 5).map((o: any) => ({
          orderNumber: o?.orderNumber || 'N/A',
          status: o?.status || 'N/A',
          paymentMethod: o?.paymentMethod || 'N/A',
          total: o?.total || 0
        }))
      });
      
      const cashOrders = Array.isArray(finalizedOrders)
        ? finalizedOrders.filter((o: any) => o?.paymentMethod === 'CASH')
        : [];
      const cardOrders = Array.isArray(finalizedOrders)
        ? finalizedOrders.filter((o: any) => o?.paymentMethod === 'CARD')
        : [];
      const paidOrders = Array.isArray(finalizedOrders)
        ? finalizedOrders.filter((o: any) => o?.paymentMethod === 'PAID')
        : [];
      
      const totalCash = cashOrders.reduce((sum: number, order: any) => sum + (order?.total || 0), 0);
      const totalCard = cardOrders.reduce((sum: number, order: any) => sum + (order?.total || 0), 0);
      const totalPaid = paidOrders.reduce((sum: number, order: any) => sum + (order?.total || 0), 0);
      
      const stats = {
        total: finalizedOrders.length,
        cash: cashOrders.length,
        card: cardOrders.length,
        paid: paidOrders.length,
        totalCash: totalCash,
        totalCard: totalCard,
        totalPaid: totalPaid,
        totalAmount: totalCash + totalCard + totalPaid
      };
      
      console.log('📊 Payment stats calculated:', {
        ...stats,
        breakdown: {
          cashOrders: cashOrders.length,
          cardOrders: cardOrders.length,
          totalCash,
          totalCard
        },
        sampleOrders: finalizedOrders.slice(0, 3).map((o: any) => ({
          orderNumber: o?.orderNumber || 'N/A',
          status: o?.status || 'N/A',
          paymentMethod: o?.paymentMethod || 'N/A',
          total: o?.total || 0
        }))
      });
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('❌ Error getting payment stats:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        name: error?.name
      });
      next(error);
    }
  }
}