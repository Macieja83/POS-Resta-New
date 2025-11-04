import { Router } from 'express';

export function createTestRouter() {
  const router = Router();
  
  // Simple test endpoint to verify empapp can reach backend
  router.get('/test-connection', (req, res) => {
    console.log('🧪 Test connection endpoint called from:', req.get('Origin'));
    res.json({
      success: true,
      message: 'Backend is reachable from empapp',
      timestamp: new Date().toISOString(),
      origin: req.get('Origin'),
      headers: {
        'user-agent': req.get('User-Agent'),
        'accept': req.get('Accept')
      }
    });
  });
  
  // Test endpoint that returns simple orders data without Zod validation
  router.get('/test-orders', (req, res) => {
    console.log('🧪 Test orders endpoint called from:', req.get('Origin'));
    
    // Return minimal order structure that empapp can parse
    res.json({
      success: true,
      data: [
        {
          id: 'test-order-1',
          orderNumber: 'TEST-001',
          status: 'OPEN',
          type: 'DELIVERY',
          total: 50.00,
          customer: {
            id: 'test-customer-1',
            name: 'Test Customer',
            phone: '123456789',
            email: 'test@example.com'
          },
          items: [
            {
              id: 'test-item-1',
              name: 'Test Pizza',
              quantity: 1,
              price: 50.00,
              total: 50.00,
              addons: [],
              ingredients: [],
              addedIngredients: [],
              removedIngredients: []
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      pagination: {
        limit: 20,
        page: 1,
        hasMore: false,
        total: 1
      }
    });
  });
  
  return router;
}





