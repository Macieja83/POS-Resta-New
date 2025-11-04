import { Router } from 'express';
import { EmployeesController } from '../controllers/employees.controller';
import { EmployeesService } from '../services/employees.service';
import { EmployeesRepository } from '../repos/employees.repo';
import { prisma } from '../lib/database';

export function createAuthRouter() {
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
  
  const employeesRepository = new EmployeesRepository(prisma);
  const employeesService = new EmployeesService(employeesRepository);
  const employeesController = new EmployeesController(employeesService);

  // POST /api/auth/login - Login for mobile app (empapp)
  router.post('/login', employeesController.loginWithCode.bind(employeesController));
  
  // POST /api/auth/logout - Logout (just returns success)
  router.post('/logout', (req, res) => {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });

  return router;
}
