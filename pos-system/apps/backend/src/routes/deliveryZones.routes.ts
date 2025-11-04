import { Router } from 'express';
import { deliveryZonesController } from '../controllers/deliveryZones.controller';

const router = Router();

// GET /api/delivery-zones - Get all delivery zones
router.get('/', deliveryZonesController.getAll);

// GET /api/delivery-zones/:id - Get single delivery zone
router.get('/:id', deliveryZonesController.getById);

// POST /api/delivery-zones - Create new delivery zone
router.post('/', deliveryZonesController.create);

// PUT /api/delivery-zones/:id - Update delivery zone
router.put('/:id', deliveryZonesController.update);

// DELETE /api/delivery-zones/:id - Delete delivery zone
router.delete('/:id', deliveryZonesController.delete);

export default router;











































