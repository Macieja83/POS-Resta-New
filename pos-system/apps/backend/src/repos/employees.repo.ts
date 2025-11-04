import { PrismaClient } from '@prisma/client';
import { EmployeeRole } from '../types/local';

export class EmployeesRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll() {
    return this.prisma.employee.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  async findAllIncludingInactive() {
    return this.prisma.employee.findMany({
      orderBy: {
        name: 'asc'
      }
    });
  }

  async findByRole(role: EmployeeRole) {
    return this.prisma.employee.findMany({
      where: {
        role: role,
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  async findById(id: string) {
    return this.prisma.employee.findUnique({
      where: { id }
    });
  }

  async findByLoginCode(loginCode: string) {
    return this.prisma.employee.findUnique({
      where: { loginCode }
    });
  }

  async findByEmail(email: string) {
    return this.prisma.employee.findUnique({
      where: { email }
    });
  }

  async create(data: {
    name: string;
    email: string;
    phone?: string;
    role: EmployeeRole;
    loginCode?: string;
  }) {
    return this.prisma.employee.create({
      data
    });
  }

  async update(id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    role?: EmployeeRole;
    loginCode?: string;
    isActive?: boolean;
  }) {
    return this.prisma.employee.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return this.prisma.employee.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async updateDriverLocation(driverId: string, latitude: number, longitude: number, orderId?: string) {
    // First verify that the driver (employee) exists
    const driver = await this.prisma.employee.findUnique({
      where: { id: driverId },
      select: { id: true, name: true, email: true }
    });
    
    if (!driver) {
      console.error('❌ Driver not found:', driverId);
      throw new Error(`Driver with ID ${driverId} not found`);
    }
    
    console.log('📍 Updating location for driver:', {
      driverId,
      driverName: driver.name,
      latitude,
      longitude,
      orderId
    });
    
    // Upsert driver location - update if exists, create if not
    const location = await this.prisma.driverLocation.upsert({
      where: {
        driverId: driverId
      },
      update: {
        latitude,
        longitude,
        orderId: orderId || null,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        driverId,
        latitude,
        longitude,
        orderId: orderId || null,
        isActive: true
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true
      }
        }
      }
    });
    
    console.log('✅ Location saved:', {
      locationId: location.id,
      driverId: location.driverId,
      hasDriver: !!location.driver,
      driverName: location.driver?.name || 'NO DRIVER',
      latitude: location.latitude,
      longitude: location.longitude,
      isActive: location.isActive
    });
    
    return location;
  }

  async getActiveDriverLocations() {
    try {
      const staleThreshold = new Date(Date.now() - 5 * 60 * 1000);

      // Automatically mark stale locations as inactive to avoid showing outdated data on the map
      const deactivated = await this.prisma.driverLocation.updateMany({
        where: {
          isActive: true,
          updatedAt: {
            lt: staleThreshold
          }
        },
        data: {
          isActive: false
        }
      });

      if (deactivated.count > 0) {
        console.log('📍 Repository: Deactivated stale driver locations:', deactivated.count);
      }

      const locations = await this.prisma.driverLocation.findMany({
        where: {
          isActive: true,
          updatedAt: {
            gte: staleThreshold
          }
        },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
      
      console.log('📍 Repository: Found driver locations:', locations.length);
      locations.forEach(loc => {
        console.log('📍 Location:', {
          id: loc.id,
          driverId: loc.driverId,
          hasDriver: !!loc.driver,
          driverName: loc.driver?.name || 'NO DRIVER RELATION',
          latitude: loc.latitude,
          longitude: loc.longitude,
          isActive: loc.isActive,
          updatedAt: loc.updatedAt
        });
      });
      
      return locations;
    } catch (error) {
      console.error('❌ Error in getActiveDriverLocations:', error);
      throw error;
    }
  }
}
