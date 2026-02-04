import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import uploadController, { upload } from './controllers/upload.controller';
import { initializeDatabase } from './lib/database';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import deliveryZonesRouter from './routes/deliveryZones.routes';
import { createEmployeesRouter } from './routes/employees.routes';
import { createHealthRouter } from './routes/health.routes';
import { createMenuRouter } from './routes/menu.routes';
import { createOrdersRouter } from './routes/orders.routes';
import quoteRouter from './routes/quote.routes';
import settingsRouter from './routes/settings.routes';
import { createAuthRouter } from './routes/auth.routes';
import { createDriverRouter } from './routes/driver.routes';
import { createTestRouter } from './routes/test.routes';
import { createEmployeesFixRouter } from './routes/employees-fix.routes';

export async function createApp() {
  const app = express();
  
  // Initialize database connection
  await initializeDatabase();

  // Security middleware
  app.use(helmet());

  // CORS: allow explicit list + any *.vercel.app (production + preview deployments)
  const explicitOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://pos-system-frontend.vercel.app',
        'https://pos-system-frontend-two.vercel.app',
        'https://pos-system-frontend-flax.vercel.app',
        'https://empapp-lfjl87tx3-macieja83s-projects.vercel.app',
        'https://empapp-75n5xj9wj-macieja83s-projects.vercel.app',
        'https://empapp-r9kyllvkd-macieja83s-projects.vercel.app',
        'https://empapp-6rehstvhw-macieja83s-projects.vercel.app',
        ...(process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) || [])
      ]
    : [
        'http://localhost:5173',
        'http://localhost:8081',
        'http://localhost:8082',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://192.168.1.60:8081',
        'http://192.168.1.61:8081',
        'http://192.168.1.100:4000',
        'http://192.168.1.66:8081',
        'http://192.168.1.66:8082',
        'http://192.168.1.66:8083',
        'http://192.168.1.66:8084',
        'http://192.168.1.66:8085',
        'http://192.168.1.66:8086',
        'http://172.20.10.4:8081',
        'http://172.20.10.4:8082',
        'http://172.20.10.4:8083',
        'http://172.20.10.4:8084',
        'http://172.20.10.4:8085',
        'http://172.20.10.4:8086'
      ];

  const vercelOriginRegex = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;
  app.use(cors({
    origin: (origin, cb) => {
      if (origin == null) return cb(null, true); // same-origin or tools like Postman
      if (explicitOrigins.includes(origin)) return cb(null, true);
      if (process.env.NODE_ENV === 'production' && vercelOriginRegex.test(origin)) return cb(null, true);
      cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(morgan('combined'));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Static file serving for uploads
  app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

  // Swagger configuration
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'POS System API',
        version: '1.0.0',
        description: 'API for POS System with Menu Builder',
      },
      servers: [
        {
          url: process.env.NODE_ENV === 'production' 
            ? (process.env.API_URL || 'https://pos-system-backend.vercel.app/api')
            : 'http://localhost:4000/api',
          description: process.env.NODE_ENV === 'production' 
            ? 'Production server'
            : 'Development server',
        },
      ],
      components: {
        schemas: {
          Category: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              vatRate: { type: 'number' },
              isDefault: { type: 'boolean' },
              isOnline: { type: 'boolean' },
              imageUrl: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          CreateCategory: {
            type: 'object',
            required: ['name', 'vatRate'],
            properties: {
              name: { type: 'string' },
              vatRate: { type: 'number' },
              isDefault: { type: 'boolean' },
              isOnline: { type: 'boolean' },
              imageUrl: { type: 'string' },
            },
          },
          UpdateCategory: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              vatRate: { type: 'number' },
              isDefault: { type: 'boolean' },
              isOnline: { type: 'boolean' },
              imageUrl: { type: 'string' },
            },
          },
          Size: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              categoryId: { type: 'string' },
              name: { type: 'string' },
              isDefaultInCategory: { type: 'boolean' },
              isOnline: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          CreateSize: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
              isDefaultInCategory: { type: 'boolean' },
              isOnline: { type: 'boolean' },
            },
          },
          UpdateSize: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              isDefaultInCategory: { type: 'boolean' },
              isOnline: { type: 'boolean' },
            },
          },
          Dish: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              categoryId: { type: 'string' },
              name: { type: 'string' },
              isOnline: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          CreateDish: {
            type: 'object',
            required: ['categoryId', 'name'],
            properties: {
              categoryId: { type: 'string' },
              name: { type: 'string' },
              isOnline: { type: 'boolean' },
            },
          },
          UpdateDish: {
            type: 'object',
            properties: {
              categoryId: { type: 'string' },
              name: { type: 'string' },
              isOnline: { type: 'boolean' },
            },
          },
          DishSize: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              dishId: { type: 'string' },
              sizeId: { type: 'string' },
              price: { type: 'number' },
              vatSource: { type: 'string', enum: ['INHERIT', 'OVERRIDE'] },
              vatOverride: { type: 'number' },
              isOnline: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          CreateDishSize: {
            type: 'object',
            required: ['sizeId', 'price'],
            properties: {
              sizeId: { type: 'string' },
              price: { type: 'number' },
              vatSource: { type: 'string', enum: ['INHERIT', 'OVERRIDE'] },
              vatOverride: { type: 'number' },
              isOnline: { type: 'boolean' },
            },
          },
          UpdateDishSize: {
            type: 'object',
            properties: {
              sizeId: { type: 'string' },
              price: { type: 'number' },
              vatSource: { type: 'string', enum: ['INHERIT', 'OVERRIDE'] },
              vatOverride: { type: 'number' },
              isOnline: { type: 'boolean' },
            },
          },
          Ingredient: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              dishId: { type: 'string' },
              name: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          CreateIngredient: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
            },
          },
          AddonGroup: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              isOnline: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          CreateAddonGroup: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
              isOnline: { type: 'boolean' },
            },
          },
          UpdateAddonGroup: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              isOnline: { type: 'boolean' },
            },
          },
          AddonItem: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              groupId: { type: 'string' },
              name: { type: 'string' },
              price: { type: 'number' },
              isOnline: { type: 'boolean' },
              sortOrder: { type: 'number' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          CreateAddonItem: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
              price: { type: 'number' },
              isOnline: { type: 'boolean' },
              sortOrder: { type: 'number' },
            },
          },
          UpdateAddonItem: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              price: { type: 'number' },
              isOnline: { type: 'boolean' },
              sortOrder: { type: 'number' },
            },
          },
          Modifier: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              groupId: { type: 'string' },
              selectionType: { type: 'string', enum: ['SINGLE', 'MULTI'] },
              minSelect: { type: 'number' },
              maxSelect: { type: 'number' },
              includedFreeQty: { type: 'number' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          CreateModifier: {
            type: 'object',
            required: ['groupId'],
            properties: {
              selectionType: { type: 'string', enum: ['SINGLE', 'MULTI'] },
              minSelect: { type: 'number' },
              maxSelect: { type: 'number' },
              includedFreeQty: { type: 'number' },
            },
          },
          UpdateModifier: {
            type: 'object',
            properties: {
              selectionType: { type: 'string', enum: ['SINGLE', 'MULTI'] },
              minSelect: { type: 'number' },
              maxSelect: { type: 'number' },
              includedFreeQty: { type: 'number' },
            },
          },
          GroupAssignment: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              groupId: { type: 'string' },
              categoryId: { type: 'string' },
              dishId: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          CreateGroupAssignment: {
            type: 'object',
            properties: {
              categoryId: { type: 'string' },
              dishId: { type: 'string' },
            },
          },
          QuoteRequest: {
            type: 'object',
            required: ['dishId', 'sizeId', 'selections'],
            properties: {
              dishId: { type: 'string' },
              sizeId: { type: 'string' },
              selections: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['groupId', 'itemId', 'qty'],
                  properties: {
                    groupId: { type: 'string' },
                    itemId: { type: 'string' },
                    qty: { type: 'number' },
                  },
                },
              },
            },
          },
          QuoteResponse: {
            type: 'object',
            properties: {
              basePrice: { type: 'number' },
              addonsPrice: { type: 'number' },
              total: { type: 'number' },
              vatRate: { type: 'number' },
              lines: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    label: { type: 'string' },
                    price: { type: 'number' },
                  },
                },
              },
            },
          },
          MergeSizesRequest: {
            type: 'object',
            required: ['targetSizeId'],
            properties: {
              targetSizeId: { type: 'string' },
            },
          },
        },
      },
    },
    apis: ['./src/controllers/*.ts', './src/routes/*.ts'],
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);

  // Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Simple homepage
  app.get('/', (_req, res) => {
    res.json({
      message: 'POS System Backend API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/api/health',
        orders: '/api/orders',
        employees: '/api/employees',
        menu: '/api/menu',
        quote: '/api/quote',
        deliveryZones: '/api/delivery-zones'
      },
      docs: '/api-docs'
    });
  });

  // API routes
  app.use('/api/health', createHealthRouter());
  app.use('/api/orders', createOrdersRouter());
  app.use('/api/employees', createEmployeesRouter());
  app.use('/api/menu', createMenuRouter());
  app.use('/api/quote', quoteRouter);
  app.use('/api/delivery-zones', deliveryZonesRouter);
  app.use('/api/settings', settingsRouter);
  
  // Test routes for debugging empapp connection
  app.use('/api/test', createTestRouter());
  
  // Employees fix routes (auto-generate loginCode for employees)
  app.use('/api/employees-fix', createEmployeesFixRouter());
  
  // Mobile app routes (empapp)
  app.use('/api/auth', createAuthRouter());
  app.use('/api/driver', createDriverRouter());
  
  // Upload routes
  app.post('/api/upload/image', upload.single('image'), uploadController.uploadImage);
  app.delete('/api/upload/image/:filename', uploadController.deleteImage);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}
