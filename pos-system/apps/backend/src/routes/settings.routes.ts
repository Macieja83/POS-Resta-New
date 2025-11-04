import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const settingsController = new SettingsController(prisma);

// Company settings routes
router.get('/company', settingsController.getCompanySettings);
router.put('/company', settingsController.updateCompanySettings);

export default router;
