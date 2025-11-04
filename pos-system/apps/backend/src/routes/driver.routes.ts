import { Router } from 'express';
import { EmployeesController } from '../controllers/employees.controller';
import { EmployeesService } from '../services/employees.service';
import { EmployeesRepository } from '../repos/employees.repo';
import { prisma } from '../lib/database';
import { verifyToken } from '../middlewares/auth';

export function createDriverRouter() {
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

  // POST /api/driver/location - Update driver location (for empapp)
  router.post('/location', verifyToken, employeesController.updateDriverLocation.bind(employeesController));
  
  // POST /api/driver/location/stop - Deactivate driver location tracking
  router.post('/location/stop', verifyToken, employeesController.deactivateDriverLocation.bind(employeesController));
  
  // Test endpoint without auth for debugging
  router.post('/location-test', employeesController.updateDriverLocation.bind(employeesController));

  return router;
}
