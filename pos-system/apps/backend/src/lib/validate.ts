import { z } from 'zod';
import { OrderStatus, OrderType, EmployeeRole, PaymentMethod } from '../types/local';
import { AppError } from '../middlewares/errorHandler';

// Local schemas
export const CreateOrderRequestSchema = z.object({
  type: z.nativeEnum(OrderType),
  customer: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email().optional(),
    address: z.object({
      street: z.string().min(1),
      city: z.string().min(1),
      postalCode: z.string().min(1),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }).optional(),
  }),
  items: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().positive(),
    price: z.number().positive(),
    addons: z.array(z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      quantity: z.number(),
    })).optional(),
    ingredients: z.array(z.object({
      id: z.string(),
      name: z.string(),
    })).optional(),
    addedIngredients: z.array(z.object({
      id: z.string(),
      name: z.string(),
      quantity: z.number().optional(),
    })).optional(),
    removedIngredients: z.array(z.object({
      id: z.string(),
      name: z.string(),
    })).optional(),
    isHalfHalf: z.boolean().optional(),
    selectedSize: z.object({
      name: z.string(),
      price: z.number(),
    }).optional(),
    leftHalf: z.object({
      dishName: z.string(),
      addons: z.array(z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number(),
      })).optional(),
      addedIngredients: z.array(z.object({
        id: z.string(),
        name: z.string(),
        quantity: z.number().optional(),
      })).optional(),
      removedIngredients: z.array(z.object({
        id: z.string(),
        name: z.string(),
      })).optional(),
    }).optional(),
    rightHalf: z.object({
      dishName: z.string(),
      addons: z.array(z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number(),
      })).optional(),
      addedIngredients: z.array(z.object({
        id: z.string(),
        name: z.string(),
        quantity: z.number().optional(),
      })).optional(),
      removedIngredients: z.array(z.object({
        id: z.string(),
        name: z.string(),
      })).optional(),
    }).optional(),
  })).min(1),
  notes: z.string().optional(),
  tableNumber: z.string().optional(),
  promisedTime: z.number().positive().optional(),
});

export const UpdateOrderRequestSchema = z.object({
  type: z.nativeEnum(OrderType).optional(),
  customer: z.object({
    name: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.object({
      street: z.string().min(1).optional(),
      city: z.string().min(1).optional(),
      postalCode: z.string().min(1).optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }).optional(),
  }).optional(),
  items: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().positive(),
    price: z.number().positive(),
    addons: z.array(z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      quantity: z.number(),
    })).optional(),
    ingredients: z.array(z.object({
      id: z.string(),
      name: z.string(),
    })).optional(),
    addedIngredients: z.array(z.object({
      id: z.string(),
      name: z.string(),
      quantity: z.number().optional(),
    })).optional(),
    removedIngredients: z.array(z.object({
      id: z.string(),
      name: z.string(),
    })).optional(),
    isHalfHalf: z.boolean().optional(),
    selectedSize: z.object({
      name: z.string(),
      price: z.number().optional(),
    }).optional(),
    leftHalf: z.object({
      name: z.string(),
      addons: z.array(z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number(),
      })).optional(),
      removedIngredients: z.array(z.object({
        id: z.string(),
        name: z.string(),
      })).optional(),
    }).optional(),
    rightHalf: z.object({
      name: z.string(),
      addons: z.array(z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number(),
      })).optional(),
      removedIngredients: z.array(z.object({
        id: z.string(),
        name: z.string(),
      })).optional(),
    }).optional(),
    notes: z.string().optional(),
  })).optional(),
  notes: z.string().optional(),
  tableNumber: z.string().optional().or(z.literal('')),
  promisedTime: z.number().positive().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
});

export const UpdateOrderStatusRequestSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  completedBy: z.object({
    id: z.string(),
    name: z.string(),
    role: z.preprocess(
      (val) => (typeof val === 'string' ? val.toUpperCase() : val),
      z.nativeEnum(EmployeeRole)
    ),
  }).optional(),
}).refine(data => data.status || data.paymentMethod, {
  message: 'Either status or paymentMethod must be provided',
});

export const AssignEmployeeRequestSchema = z.object({
  employeeId: z.string().min(1),
});

export const QuoteRequestSchema = z.object({
  dishId: z.string(),
  sizeId: z.string(),
  selections: z.array(z.object({
    groupId: z.string(),
    itemIds: z.array(z.string()),
    qty: z.number()
  }))
});

// Validation function
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  console.log('🔍 Validating input:', JSON.stringify(data, null, 2));
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
      received: (err as any).received
    }));
    
    console.error('❌ Validation failed:', errors);
    const message = `Validation failed: ${errors.map(e => `${e.field}: ${e.message} (received: ${e.received})`).join(', ')}`;
    throw new AppError(message, 400);
  }
  
  console.log('✅ Validation passed');
  return result.data;
}

// Export schemas for use in controllers
export const createOrderSchema = CreateOrderRequestSchema;
export const updateOrderSchema = UpdateOrderRequestSchema;
export const updateOrderStatusSchema = UpdateOrderStatusRequestSchema;
export const assignEmployeeRequestSchema = AssignEmployeeRequestSchema;

// Fixed orders filters schema - converts strings to numbers
// Note: 'HISTORICAL' is not a real OrderStatus enum value, but a special filter value
// that maps to [COMPLETED, CANCELLED] in the repository
export const ordersFiltersSchema = z.object({
  status: z.union([
    z.nativeEnum(OrderStatus),
    z.literal('HISTORICAL') // Special filter value for completed/cancelled orders
  ]).optional(),
  type: z.nativeEnum(OrderType).optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  assignedEmployeeId: z.string().optional(),
  page: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().positive()).optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().positive().max(100)).optional(),
});

export const quoteRequestSchema = QuoteRequestSchema;

// Additional validation schemas for specific use cases
export const employeeLoginSchema = z.object({
  loginCode: z.string().regex(/^\d{4}$/, 'Login code must be a 4-digit number')
});

export const publicOrderSchema = z.object({
  items: z.array(z.object({
    name: z.string().min(1, 'Item name is required'),
    quantity: z.number().positive('Quantity must be positive'),
    price: z.number().positive('Price must be positive'),
    addons: z.array(z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      quantity: z.number(),
    })).optional(),
    ingredients: z.array(z.object({
      id: z.string(),
      name: z.string(),
    })).optional(),
    addedIngredients: z.array(z.object({
      id: z.string(),
      name: z.string(),
      quantity: z.number().optional(),
    })).optional(),
    removedIngredients: z.array(z.object({
      id: z.string(),
      name: z.string(),
    })).optional(),
    isHalfHalf: z.boolean().optional(),
    selectedSize: z.object({
      name: z.string(),
      price: z.number(),
    }).optional(),
    leftHalf: z.object({
      dishName: z.string(),
      addons: z.array(z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number(),
      })).optional(),
      addedIngredients: z.array(z.object({
        id: z.string(),
        name: z.string(),
        quantity: z.number().optional(),
      })).optional(),
      removedIngredients: z.array(z.object({
        id: z.string(),
        name: z.string(),
      })).optional(),
    }).optional(),
    rightHalf: z.object({
      dishName: z.string(),
      addons: z.array(z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number(),
      })).optional(),
      addedIngredients: z.array(z.object({
        id: z.string(),
        name: z.string(),
        quantity: z.number().optional(),
      })).optional(),
      removedIngredients: z.array(z.object({
        id: z.string(),
        name: z.string(),
      })).optional(),
    }).optional(),
  })).min(1, 'At least one item is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(1, 'Customer phone is required'),
  tableNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const geocodeRequestSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
});

export const deliveryZoneSchema = z.object({
  name: z.string().min(1, 'Zone name is required'),
  coordinates: z.string().min(1, 'Coordinates are required'),
  deliveryPrice: z.number().min(0, 'Delivery price must be non-negative'),
  minOrderValue: z.number().min(0, 'Minimum order value must be non-negative'),
  freeDeliveryFrom: z.number().min(0, 'Free delivery threshold must be non-negative').optional(),
  courierRate: z.number().min(0, 'Courier rate must be non-negative').optional(),
  area: z.number().min(0, 'Area must be non-negative'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'),
  isActive: z.boolean().default(true),
});

export const updateDeliveryZoneSchema = deliveryZoneSchema.partial();

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  vatRate: z.number().min(0).max(100, 'VAT rate must be between 0 and 100'),
  isDefault: z.boolean().default(false),
  isOnline: z.boolean().default(true),
  imageUrl: z.string().url().optional(),
});

export const updateCategorySchema = categorySchema.partial();

export const sizeSchema = z.object({
  name: z.string().min(1, 'Size name is required'),
  isDefaultInCategory: z.boolean().default(false),
  isOnline: z.boolean().default(true),
});

export const updateSizeSchema = sizeSchema.partial();

export const dishSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  name: z.string().min(1, 'Dish name is required'),
  isOnline: z.boolean().default(true),
});

export const updateDishSchema = dishSchema.partial();

export const dishSizeSchema = z.object({
  sizeId: z.string().min(1, 'Size ID is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  vatSource: z.enum(['INHERIT', 'OVERRIDE']).default('INHERIT'),
  vatOverride: z.number().min(0).max(100).optional(),
  isOnline: z.boolean().default(true),
});

export const updateDishSizeSchema = dishSizeSchema.partial();

export const ingredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required'),
});

export const addonGroupSchema = z.object({
  name: z.string().min(1, 'Addon group name is required'),
  isOnline: z.boolean().default(true),
});

export const updateAddonGroupSchema = addonGroupSchema.partial();

export const addonItemSchema = z.object({
  name: z.string().min(1, 'Addon item name is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  isOnline: z.boolean().default(true),
  sortOrder: z.number().min(0, 'Sort order must be non-negative').default(0),
});

export const updateAddonItemSchema = addonItemSchema.partial();

export const modifierSchema = z.object({
  selectionType: z.enum(['SINGLE', 'MULTI']).default('MULTI'),
  minSelect: z.number().min(0, 'Minimum select must be non-negative').default(0),
  maxSelect: z.number().min(0, 'Maximum select must be non-negative').optional(),
  includedFreeQty: z.number().min(0, 'Included free quantity must be non-negative').default(0),
});

export const updateModifierSchema = modifierSchema.partial();

export const groupAssignmentSchema = z.object({
  categoryId: z.string().optional(),
  dishId: z.string().optional(),
}).refine(data => data.categoryId || data.dishId, {
  message: 'Either categoryId or dishId must be provided',
});

export const mergeSizesRequestSchema = z.object({
  targetSizeId: z.string().min(1, 'Target size ID is required'),
});