import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

export class SettingsController {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Get company settings
  getCompanySettings = async (req: Request, res: Response) => {
    try {
      const settings = await this.prisma.companySettings.findFirst();
      
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Error fetching company settings:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas pobierania ustawień firmy'
      });
    }
  };

  // Update company settings
  updateCompanySettings = async (req: Request, res: Response) => {
    try {
      const { name, address, latitude, longitude, phone, email, website } = req.body;

      if (!name || !address) {
        return res.status(400).json({
          success: false,
          error: 'Nazwa i adres są wymagane'
        });
      }

      // Check if settings exist
      const existingSettings = await this.prisma.companySettings.findFirst();
      
      let settings;
      if (existingSettings) {
        // Update existing settings
        settings = await this.prisma.companySettings.update({
          where: { id: existingSettings.id },
          data: {
            name,
            address,
            latitude: latitude || null,
            longitude: longitude || null,
            phone: phone || null,
            email: email || null,
            website: website || null,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new settings
        settings = await this.prisma.companySettings.create({
          data: {
            name,
            address,
            latitude: latitude || null,
            longitude: longitude || null,
            phone: phone || null,
            email: email || null,
            website: website || null
          }
        });
      }

      res.json({
        success: true,
        data: settings,
        message: 'Ustawienia firmy zostały zaktualizowane'
      });
    } catch (error) {
      console.error('Error updating company settings:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas aktualizacji ustawień firmy'
      });
    }
  };
}
