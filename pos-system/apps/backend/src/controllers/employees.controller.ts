import { Request, Response, NextFunction } from 'express';
import { EmployeesService } from '../services/employees.service';
import { generateToken } from '../middlewares/auth';

export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  async getEmployees(_req: Request, res: Response, next: NextFunction) {
    try {
      const employees = await this.employeesService.getEmployees();
      
      res.json({
        success: true,
        data: employees
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllEmployees(_req: Request, res: Response, next: NextFunction) {
    try {
      const employees = await this.employeesService.getAllEmployees();
      
      res.json({
        success: true,
        data: employees
      });
    } catch (error) {
      next(error);
    }
  }

  async getDrivers(_req: Request, res: Response, next: NextFunction) {
    try {
      const drivers = await this.employeesService.getDrivers();
      
      res.json({
        success: true,
        data: drivers
      });
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const employee = await this.employeesService.getEmployeeById(id);
      
      res.json({
        success: true,
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }

  async createEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeData = req.body;
      const newEmployee = await this.employeesService.createEmployee(employeeData);
      
      res.status(201).json({
        success: true,
        data: newEmployee
      });
    } catch (error) {
      next(error);
    }
  }

  async generateNewLoginCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updatedEmployee = await this.employeesService.generateNewLoginCode(id);
      
      res.json({
        success: true,
        data: updatedEmployee,
        message: 'Nowy kod logowania został wygenerowany'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateLoginCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { loginCode } = req.body;
      const updatedEmployee = await this.employeesService.updateLoginCode(id, loginCode);
      
      res.json({
        success: true,
        data: updatedEmployee,
        message: 'Kod logowania został zaktualizowany'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const employeeData = req.body;
      const employee = await this.employeesService.updateEmployee(id, employeeData);
      
      res.json({
        success: true,
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.employeesService.deleteEmployee(id);
      
      res.json({
        success: true,
        message: 'Pracownik został usunięty'
      });
    } catch (error) {
      next(error);
    }
  }

  async loginWithCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { loginCode, email } = req.body;
      
      // EXTENSIVE LOGGING FOR DEBUGGING
      console.log('========================================');
      console.log('🔐 loginWithCode CALLED!');
      console.log('   LoginCode:', loginCode);
      console.log('   Email:', email);
      console.log('   Origin:', req.get('Origin'));
      console.log('   User-Agent:', req.get('User-Agent'));
      console.log('========================================');
      
      let employee;
      
      // Try email first if provided, then loginCode
      if (email) {
        try {
          employee = await this.employeesService.getEmployeeByEmail(email);
        } catch {
          console.log('Email login failed, trying loginCode...');
        }
      }
      
      // If email login didn't work or email not provided, try loginCode
      if (!employee && loginCode) {
      // AUTOMATIC FIX: Ensure all employees have loginCode before trying to login
      try {
        await this.employeesService.ensureAllEmployeesHaveLoginCode();
      } catch (ensureError) {
        console.warn('⚠️ Warning: Could not ensure all employees have loginCode:', ensureError);
      }
      
        try {
          employee = await this.employeesService.getEmployeeByLoginCode(loginCode);
        } catch (loginError) {
          const msg = loginError instanceof Error ? loginError.message : 'Nieprawidłowy kod logowania';
          return res.status(401).json({ success: false, error: msg });
        }
      }
      
      if (!employee) {
        return res.status(401).json({
          success: false,
          error: 'Nieprawidłowy kod logowania lub email'
        });
      }
      
      console.log('✅ Employee found:', {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        loginCode: employee.loginCode,
        isActive: employee.isActive
      });
      
      // Generate JWT token
      const token = generateToken({
        id: employee.id,
        email: employee.email,
        role: employee.role
      });
      
      console.log('✅ Token generated successfully');
      console.log('========================================');
      
      res.json({
        success: true,
        data: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
          role: employee.role
        },
        token: token
      });
    } catch (error) {
      console.error('❌ Login error:', error instanceof Error ? error.message : String(error));
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
      next(error);
    }
  }

  async updateDriverLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, error: 'Brak autoryzacji' });
      }
      const { latitude, longitude, orderId } = req.body;
      
      console.log('📍 Driver location update request:', {
        driverId: user.id,
        driverEmail: user.email,
        latitude,
        longitude,
        orderId,
        timestamp: new Date().toISOString()
      });
      
      if (!latitude || !longitude) {
        console.error('❌ Missing location data:', { latitude, longitude });
        return res.status(400).json({
          success: false,
          error: 'Latitude and longitude are required'
        });
      }

      // Validate latitude and longitude are numbers
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        console.error('❌ Invalid location data types:', { 
          latitude: typeof latitude, 
          longitude: typeof longitude,
          latitudeValue: latitude,
          longitudeValue: longitude
        });
        return res.status(400).json({
          success: false,
          error: 'Latitude and longitude must be numbers'
        });
      }

      // Validate latitude and longitude ranges
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        console.error('❌ Invalid location coordinates:', { latitude, longitude });
        return res.status(400).json({
          success: false,
          error: 'Invalid latitude or longitude values'
        });
      }

      // Update driver location in database
      const location = await this.employeesService.updateDriverLocation(
        user.id, 
        latitude, 
        longitude, 
        orderId
      );
      
      console.log('✅ Driver location updated successfully:', {
        driverId: user.id,
        locationId: location.id,
        hasDriver: !!location.driver,
        driverName: location.driver?.name || 'NO DRIVER RELATION',
        latitude: location.latitude,
        longitude: location.longitude,
        isActive: location.isActive,
        updatedAt: location.updatedAt
      });
      
      res.json({
        success: true,
        data: location
      });
    } catch (error) {
      console.error('❌ Error updating driver location:', error);
      next(error);
    }
  }

  async deactivateDriverLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, error: 'Brak autoryzacji' });
      }
      
      console.log('📍 Deactivating driver location:', {
        driverId: user.id,
        driverEmail: user.email,
        timestamp: new Date().toISOString()
      });

      // Deactivate driver location in database
      const location = await this.employeesService.deactivateDriverLocation(user.id);
      
      // If location doesn't exist, still return success (nothing to deactivate)
      if (!location) {
        console.log('ℹ️  No location found to deactivate for driver:', user.id);
        return res.json({
          success: true,
          message: 'Location tracking stopped (no active location found)',
          data: {
            driverId: user.id,
            isActive: false
          }
        });
      }
      
      console.log('✅ Driver location deactivated successfully:', {
        driverId: location.driverId,
        driverName: location.driver?.name || 'Unknown',
        isActive: location.isActive
      });
      
      res.json({
        success: true,
        message: 'Location tracking stopped',
        data: {
          driverId: location.driverId,
          isActive: location.isActive
        }
      });
    } catch (error) {
      console.error('❌ Error deactivating driver location:', error);
      next(error);
    }
  }

  async getDriverLocations(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('📍 [GET] getDriverLocations endpoint called', {
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      
      // Get real driver locations from database
      const locations = await this.employeesService.getActiveDriverLocations();
      
      console.log('📍 [GET] Found locations in service:', locations.length, 'active locations');
      
      if (locations.length > 0) {
        console.log('📍 [GET] Driver locations data:', locations.map(l => ({
          driverId: l.driverId,
          driverName: l.driver?.name || 'Unknown',
          latitude: l.latitude,
          longitude: l.longitude,
          isActive: l.isActive,
          updatedAt: l.updatedAt.toISOString(),
          age: Math.round((Date.now() - new Date(l.updatedAt).getTime()) / 1000) + 's ago'
        })));
      } else {
        console.warn('⚠️ [GET] No active driver locations found!');
      }
      
      // Transform data for frontend
      const driverLocations = locations.map(location => ({
        driverId: location.driverId,
        driverName: location.driver?.name || 'Unknown',
        latitude: location.latitude,
        longitude: location.longitude,
        orderId: location.orderId,
        timestamp: location.updatedAt.toISOString(),
        isActive: location.isActive
      }));
      
      console.log('📍 [GET] Returning driver locations to frontend:', {
        count: driverLocations.length,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        data: driverLocations
      });
    } catch (error) {
      console.error('❌ [GET] Error in getDriverLocations:', error);
      next(error);
    }
  }
}
