import { Router } from 'express';
import { EmployeesController } from '../controllers/employees.controller';
import { EmployeesService } from '../services/employees.service';
import { EmployeesRepository } from '../repos/employees.repo';
import { prisma } from '../lib/database';
import { verifyToken } from '../middlewares/auth';

export function createEmployeesRouter() {
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
  
  // Always use Prisma repositories
  
  const employeesRepository = new EmployeesRepository(prisma);
  const employeesService = new EmployeesService(employeesRepository);
  const employeesController = new EmployeesController(employeesService);

  // GET /api/employees - Get all employees
  router.get('/', employeesController.getEmployees.bind(employeesController));

  // GET /api/employees/all - Get all employees (including inactive)
  router.get('/all', employeesController.getAllEmployees.bind(employeesController));

  // GET /api/employees/drivers - Get all drivers
  router.get('/drivers', employeesController.getDrivers.bind(employeesController));

  // GET /api/employees/locations - Get all driver locations (MUST be before /:id)
  router.get('/locations', employeesController.getDriverLocations.bind(employeesController));

  // GET /api/employees/:id - Get employee by ID
  router.get('/:id', employeesController.getEmployeeById.bind(employeesController));

  // POST /api/employees - Create new employee
  router.post('/', employeesController.createEmployee.bind(employeesController));

  // PUT /api/employees/:id - Update employee
  router.put('/:id', employeesController.updateEmployee.bind(employeesController));

  // POST /api/employees/:id/generate-login-code - Generate new login code
  router.post('/:id/generate-login-code', employeesController.generateNewLoginCode.bind(employeesController));

  // PUT /api/employees/:id/login-code - Update login code
  router.put('/:id/login-code', employeesController.updateLoginCode.bind(employeesController));

  // DELETE /api/employees/:id - Delete employee
  router.delete('/:id', employeesController.deleteEmployee.bind(employeesController));

  // POST /api/employees/login - Login with code
  router.post('/login', employeesController.loginWithCode.bind(employeesController));
  
  // Test login endpoint for debugging
  router.post('/login-test', (req, res) => {
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
  
  // POST /api/employees/location - Update driver location
  router.post('/location', verifyToken, employeesController.updateDriverLocation.bind(employeesController));
  
  // Test endpoint without auth for debugging
  router.post('/location-test', employeesController.updateDriverLocation.bind(employeesController));

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

  return router;
}
