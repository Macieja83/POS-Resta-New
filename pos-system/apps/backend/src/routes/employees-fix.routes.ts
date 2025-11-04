import { Router } from 'express';
import { EmployeesService } from '../services/employees.service';
import { EmployeesRepository } from '../repos/employees.repo';
import { prisma } from '../lib/database';

export function createEmployeesFixRouter() {
  const router = Router();
  
  if (!prisma) {
    return router;
  }
  
  const employeesRepository = new EmployeesRepository(prisma);
  const employeesService = new EmployeesService(employeesRepository);
  
  // POST /api/employees-fix/ensure-login-codes - Ensure all employees have loginCode
  router.post('/ensure-login-codes', async (req, res) => {
    try {
      console.log('🔧 Ensuring all employees have loginCode...');
      const result = await employeesService.ensureAllEmployeesHaveLoginCode();
      
      res.json({
        success: true,
        message: `Generated loginCode for ${result.generated} employees`,
        generated: result.generated,
        total: result.total
      });
    } catch (error) {
      console.error('❌ Error ensuring loginCodes:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // GET /api/employees-fix/check-login-codes - Check which employees have loginCode
  router.get('/check-login-codes', async (req, res) => {
    try {
      const allEmployees = await employeesRepository.findAll();
      const employeesWithCodes = allEmployees.filter(emp => emp.loginCode);
      const employeesWithoutCodes = allEmployees.filter(emp => !emp.loginCode || emp.loginCode === null);
      
      res.json({
        success: true,
        total: allEmployees.length,
        withCode: employeesWithCodes.length,
        withoutCode: employeesWithoutCodes.length,
        employeesWithCodes: employeesWithCodes.map(emp => ({
          id: emp.id,
          name: emp.name,
          loginCode: emp.loginCode,
          role: emp.role
        })),
        employeesWithoutCodes: employeesWithoutCodes.map(emp => ({
          id: emp.id,
          name: emp.name,
          role: emp.role
        }))
      });
    } catch (error) {
      console.error('❌ Error checking loginCodes:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  return router;
}





