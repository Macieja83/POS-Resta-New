import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const createDeliveryZoneSchema = z.object({
  name: z.string().min(1),
  coordinates: z.array(z.array(z.number())),
  isActive: z.boolean().optional(),
  deliveryPrice: z.number().min(0),
  minOrderValue: z.number().min(0),
  freeDeliveryFrom: z.number().min(0).optional(),
  courierRate: z.number().min(0).optional(),
  area: z.number().min(0),
  color: z.string().optional(),
});

const updateDeliveryZoneSchema = createDeliveryZoneSchema.partial();

export const deliveryZonesController = {
  // Get all delivery zones
  async getAll(_req: Request, res: Response) {
    try {
      const zones = await prisma.deliveryZone.findMany({
        orderBy: { createdAt: 'desc' }
      });

      // Parse coordinates from JSON string
      const zonesWithParsedCoordinates = zones.map((zone: any) => ({
        ...zone,
        coordinates: JSON.parse(zone.coordinates)
      }));

      res.json({
        success: true,
        data: zonesWithParsedCoordinates
      });
    } catch (error) {
      console.error('Error fetching delivery zones:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch delivery zones'
      });
    }
  },

  // Get single delivery zone
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const zone = await prisma.deliveryZone.findUnique({
        where: { id }
      });

      if (!zone) {
        return res.status(404).json({
          success: false,
          message: 'Delivery zone not found'
        });
      }

      // Parse coordinates from JSON string
      const zoneWithParsedCoordinates = {
        ...zone,
        coordinates: JSON.parse(zone.coordinates)
      };

      res.json({
        success: true,
        data: zoneWithParsedCoordinates
      });
    } catch (error) {
      console.error('Error fetching delivery zone:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch delivery zone'
      });
    }
  },

  // Create new delivery zone
  async create(req: Request, res: Response) {
    try {
      const validatedData = createDeliveryZoneSchema.parse(req.body);
      
      const zone = await prisma.deliveryZone.create({
        data: {
          ...validatedData,
          name: validatedData.name || 'Unnamed Zone',
          coordinates: JSON.stringify(validatedData.coordinates),
          isActive: validatedData.isActive ?? true,
          color: validatedData.color ?? '#3b82f6',
          deliveryPrice: validatedData.deliveryPrice || 0,
          minOrderValue: validatedData.minOrderValue || 0,
          area: validatedData.area || 0
        }
      });

      // Parse coordinates from JSON string
      const zoneWithParsedCoordinates = {
        ...zone,
        coordinates: JSON.parse(zone.coordinates)
      };

      res.status(201).json({
        success: true,
        data: zoneWithParsedCoordinates
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }

      console.error('Error creating delivery zone:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create delivery zone'
      });
    }
  },

  // Update delivery zone
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateDeliveryZoneSchema.parse(req.body);

      // Convert coordinates to JSON string if provided
      const updateData: any = {
        ...validatedData,
        ...(validatedData.coordinates && {
          coordinates: JSON.stringify(validatedData.coordinates)
        })
      };

      const zone = await prisma.deliveryZone.update({
        where: { id },
        data: updateData
      });

      // Parse coordinates from JSON string
      const zoneWithParsedCoordinates = {
        ...zone,
        coordinates: JSON.parse(zone.coordinates)
      };

      res.json({
        success: true,
        data: zoneWithParsedCoordinates
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }

      console.error('Error updating delivery zone:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update delivery zone'
      });
    }
  },

  // Delete delivery zone
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      await prisma.deliveryZone.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Delivery zone deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting delivery zone:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete delivery zone'
      });
    }
  }
};
