import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

export function createHealthRouter() {
  const router = Router();
  const healthController = new HealthController();

  router.get('/', healthController.getHealth.bind(healthController));

  return router;
}

