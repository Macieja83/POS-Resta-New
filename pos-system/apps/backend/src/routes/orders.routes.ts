import { Router } from 'express';
import { OrdersController } from '../controllers/orders.controller';
import { OrdersService } from '../services/orders.service';
import { OrdersRepository } from '../repos/orders.repo';
import { EmployeesRepository } from '../repos/employees.repo';
import { prisma, useMockData } from '../lib/database';
import { verifyToken, verifyTokenOptional } from '../middlewares/auth';

export function createOrdersRouter() {
  const router = Router();
  
  // Check if Prisma is available
  if (!prisma) {
    console.error('❌ Prisma client is not available');
    router.get('*', (req, res) => {
      res.status(500).json({
        success: false,
        error: 'Database connection not available'
      });
    });
    return router;
  }
  
  // Use real repositories with Prisma only
  const ordersRepository = new OrdersRepository(prisma);
  
  const employeesRepository = new EmployeesRepository(prisma);
  
  const ordersService = new OrdersService(ordersRepository, employeesRepository);
  const ordersController = new OrdersController(ordersService);

  // GET /api/orders/geo - Get orders with geolocation data
  router.get('/geo', ordersController.getOrdersWithGeo.bind(ordersController));

  // GET /api/orders/map - Get orders for map (minimal data)
  router.get('/map', ordersController.getOrdersForMap.bind(ordersController));

  // GET /api/orders/summary - Get order summary
  router.get('/summary', ordersController.getOrderSummary.bind(ordersController));

  // GET /api/orders - Get all orders with filters
  router.get('/', ordersController.getOrders.bind(ordersController));

  // Employee app endpoints (MUST be before /:id)
  // Temporarily remove auth requirement for debugging - TODO: re-enable verifyToken
  router.get('/available', ordersController.getAvailableOrders.bind(ordersController));
  router.get('/my-orders', verifyToken, ordersController.getMyOrders.bind(ordersController));
  
  // EMPAPP specific endpoints (MUST be before /:id to avoid route conflicts)
  // GET /api/orders/history - Get order history for driver
  router.get('/history', verifyToken, ordersController.getOrderHistory.bind(ordersController));
  
  // GET /api/orders/payment-stats - Get payment statistics for driver
  router.get('/payment-stats', verifyToken, ordersController.getPaymentStats.bind(ordersController));
  
  // Test endpoints without auth for debugging
  router.get('/test/available', ordersController.getAvailableOrders.bind(ordersController));
  router.get('/test/my-orders', (req, res, next) => {
    // Mock user for testing
    (req as any).user = { id: '1', email: 'ihor@restaurant.com', role: 'DRIVER' };
    ordersController.getMyOrders(req, res, next);
  });
  
  // Test login endpoint for debugging
  router.post('/test/login', (req, res) => {
    const { loginCode } = req.body;
    
    if (!loginCode || !/^\d{4}$/.test(loginCode)) {
      return res.status(400).json({
        success: false,
        error: 'Login code must be a 4-digit number'
      });
    }
    
    // Mock employees for testing
    const mockEmployees = [
      {
        id: '1',
        name: 'Ihor Nazarenko',
        email: 'ihor@restaurant.com',
        phone: '+48 123 456 789',
        role: 'DRIVER',
        loginCode: '1234',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Jan Kowalski',
        email: 'jan.kowalski@restaurant.com',
        phone: '+48 987 654 321',
        role: 'DRIVER',
        loginCode: '5678',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
    
    const employee = mockEmployees.find(emp => emp.loginCode === loginCode && emp.isActive);
    
    if (!employee) {
      return res.status(401).json({
        success: false,
        error: 'Invalid login code'
      });
    }
    
    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';
    const token = jwt.sign({
      id: employee.id,
      email: employee.email,
      role: employee.role
    }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({
      success: true,
      token: token,
      user: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role
      }
    });
  });
  
  // Fallback login endpoint for mobile app
  router.post('/mobile/login', (req, res) => {
    const { loginCode } = req.body;
    
    if (!loginCode || !/^\d{4}$/.test(loginCode)) {
      return res.status(400).json({
        success: false,
        error: 'Login code must be a 4-digit number'
      });
    }
    
    // Mock employees for testing
    const mockEmployees = [
      {
        id: '1',
        name: 'Ihor Nazarenko',
        email: 'ihor@restaurant.com',
        phone: '+48 123 456 789',
        role: 'DRIVER',
        loginCode: '1234',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Jan Kowalski',
        email: 'jan.kowalski@restaurant.com',
        phone: '+48 987 654 321',
        role: 'DRIVER',
        loginCode: '5678',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
    
    const employee = mockEmployees.find(emp => emp.loginCode === loginCode && emp.isActive);
    
    if (!employee) {
      return res.status(401).json({
        success: false,
        error: 'Invalid login code'
      });
    }
    
    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';
    const token = jwt.sign({
      id: employee.id,
      email: employee.email,
      role: employee.role
    }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({
      success: true,
      token: token,
      user: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role
      }
    });
  });

  // GET /api/orders/:id - Get order by ID (MUST be last)
  router.get('/:id', verifyToken, ordersController.getOrderById.bind(ordersController));

  // POST /api/orders - Create new order
  router.post('/', ordersController.createOrder.bind(ordersController));

  // POST /api/orders/public - Create order from public menu (QR code)
  router.post('/public', ordersController.createPublicOrder.bind(ordersController));

  // POST /api/orders/from-shop - Create order from restaurant shop (web orders)
  router.post('/from-shop', ordersController.createOrderFromShop.bind(ordersController));

  // POST /api/orders/:id/claim - Claim order (MUST be after /:id)
  router.post('/:id/claim', verifyToken, ordersController.claimOrder.bind(ordersController));

  // PUT /api/orders/:id - Update order
  router.put('/:id', ordersController.updateOrder.bind(ordersController));

  // PATCH /api/orders/:id/status - Update order status
  // Auth is optional: POS app may not have token, but empapp should have token
  // If token is provided, completedById will be set automatically
  router.patch('/:id/status', verifyTokenOptional, ordersController.updateOrderStatus.bind(ordersController));

  // PATCH /api/orders/:id/assign - Assign employee to order
  router.patch('/:id/assign', ordersController.assignEmployee.bind(ordersController));

  // DELETE /api/orders/:id/assign - Unassign employee from order
  router.delete('/:id/assign', ordersController.unassignEmployee.bind(ordersController));

  // PATCH /api/orders/:id/restore - Restore order from historical status
  router.patch('/:id/restore', ordersController.restoreOrder.bind(ordersController));

  // PATCH /api/orders/:id/test-status - Test endpoint to set order status
  router.patch('/:id/test-status', ordersController.setTestStatus.bind(ordersController));

  return router;
}
