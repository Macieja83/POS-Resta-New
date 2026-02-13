import { z } from 'zod';

// Enums
export enum OrderStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  READY = 'READY',
  ASSIGNED = 'ASSIGNED',
  ON_THE_WAY = 'ON_THE_WAY',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  HISTORICAL = 'HISTORICAL',
}

export enum OrderType {
  DELIVERY = 'DELIVERY',
  TAKEAWAY = 'TAKEAWAY',
  DINE_IN = 'DINE_IN',
}

export enum EmployeeRole {
  DRIVER = 'DRIVER',
  MANAGER = 'MANAGER',
  COOK = 'COOK',
  CASHIER = 'CASHIER',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  PAID = 'PAID', // Already paid (e.g., online)
}

// Base types
export interface Address {
  id: string;
  street: string;
  city: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: Address;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: EmployeeRole;
  loginCode?: string; // 4-digit login code
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryZone {
  id: string;
  name: string;
  coordinates: string;
  isActive: boolean;
  deliveryPrice: number;
  minOrderValue: number;
  freeDeliveryFrom?: number;
  courierRate?: number;
  area: number;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

// Menu Builder types
export interface Category {
  id: string;
  name: string;
  vatRate: number;
  isDefault: boolean;
  isOnline: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Size {
  id: string;
  categoryId: string;
  name: string;
  isDefaultInCategory: boolean;
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dish {
  id: string;
  categoryId: string;
  name: string;
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DishSize {
  id: string;
  dishId: string;
  sizeId: string;
  price: number;
  vatSource: 'INHERIT' | 'OVERRIDE';
  vatOverride?: number;
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ingredient {
  id: string;
  dishId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddonGroup {
  id: string;
  name: string;
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddonItem {
  id: string;
  groupId: string;
  name: string;
  price: number;
  isOnline: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Modifier {
  id: string;
  groupId: string;
  selectionType: 'SINGLE' | 'MULTI';
  minSelect: number;
  maxSelect?: number;
  includedFreeQty: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupAssignment {
  id: string;
  groupId: string;
  categoryId?: string;
  dishId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Order types with full support for menu builder
export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number; // in złotówkach
  total: number; // in złotówkach
  orderId?: string;
  
  // Menu builder support
  addons?: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  ingredients?: {
    id: string;
    name: string;
  }[];
  addedIngredients?: {
    id: string;
    name: string;
    quantity?: number;
  }[];
  removedIngredients?: {
    id: string;
    name: string;
  }[];
  isHalfHalf?: boolean;
  selectedSize?: { 
    name: string; 
    price: number; 
  };
  leftHalf?: {
    dishName: string;
    addons?: { id: string; name: string; price: number; quantity: number; }[];
    addedIngredients?: { id: string; name: string; quantity?: number; }[];
    removedIngredients?: { id: string; name: string; }[];
  };
  rightHalf?: {
    dishName: string;
    addons?: { id: string; name: string; price: number; quantity: number; }[];
    addedIngredients?: { id: string; name: string; quantity?: number; }[];
    removedIngredients?: { id: string; name: string; }[];
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  type: OrderType;
  total: number; // in złotówkach
  customer: Customer;
  items: OrderItem[];
  delivery?: {
    address: Address;
    estimatedTime?: Date;
  };
  assignedEmployee?: Employee;
  completedBy?: Employee; // Pracownik, który zakończył zamówienie
  paymentMethod?: PaymentMethod; // Forma płatności
  notes?: string;
  tableNumber?: string; // Numer stolika dla zamówień na miejscu
  promisedTime?: number; // Deklarowany czas realizacji w minutach
  createdAt: Date;
  updatedAt: Date;
}

// DTOs for API requests/responses
export interface CreateOrderRequest {
  type: OrderType;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address?: {
      street: string;
      city: string;
      postalCode: string;
      latitude?: number;
      longitude?: number;
    };
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number; // in złotówkach
    addons?: {
      id: string;
      name: string;
      price: number;
      quantity: number;
    }[];
    ingredients?: {
      id: string;
      name: string;
    }[];
    addedIngredients?: {
      id: string;
      name: string;
      quantity?: number;
    }[];
    removedIngredients?: {
      id: string;
      name: string;
    }[];
    isHalfHalf?: boolean;
    selectedSize?: { 
      name: string; 
      price: number; 
    };
    leftHalf?: {
      dishName: string;
      addons?: { id: string; name: string; price: number; quantity: number; }[];
      addedIngredients?: { id: string; name: string; quantity?: number; }[];
      removedIngredients?: { id: string; name: string; }[];
    };
    rightHalf?: {
      dishName: string;
      addons?: { id: string; name: string; price: number; quantity: number; }[];
      addedIngredients?: { id: string; name: string; quantity?: number; }[];
      removedIngredients?: { id: string; name: string; }[];
    };
  }>;
  notes?: string;
  tableNumber?: string; // Numer stolika dla zamówień na miejscu
  promisedTime?: number; // Deklarowany czas realizacji w minutach
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  completedBy?: {
    id: string;
    name: string;
    role: EmployeeRole;
  };
}

export interface AssignEmployeeRequest {
  employeeId: string;
}

export interface UpdateOrderRequest {
  type: OrderType;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address?: {
      street: string;
      city: string;
      postalCode: string;
      latitude?: number;
      longitude?: number;
    };
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number; // in złotówkach
    addons?: {
      id: string;
      name: string;
      price: number;
      quantity: number;
    }[];
    ingredients?: {
      id: string;
      name: string;
    }[];
    addedIngredients?: {
      id: string;
      name: string;
      quantity?: number;
    }[];
    removedIngredients?: {
      id: string;
      name: string;
    }[];
    isHalfHalf?: boolean;
    selectedSize?: { 
      name: string; 
      price: number; 
    };
    leftHalf?: {
      dishName: string;
      addons?: { id: string; name: string; price: number; quantity: number; }[];
      addedIngredients?: { id: string; name: string; quantity?: number; }[];
      removedIngredients?: { id: string; name: string; }[];
    };
    rightHalf?: {
      dishName: string;
      addons?: { id: string; name: string; price: number; quantity: number; }[];
      addedIngredients?: { id: string; name: string; quantity?: number; }[];
      removedIngredients?: { id: string; name: string; }[];
    };
  }>;
  notes?: string;
  tableNumber?: string; // Numer stolika dla zamówień na miejscu
}

export interface OrdersListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrdersFilters {
  status?: OrderStatus;
  type?: OrderType;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  assignedEmployeeId?: string;
  page?: number;
  limit?: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: ValidationError[];
}

// Order Summary types
export interface OrderSummaryFilters {
  dateFrom?: string;
  dateTo?: string;
  employeeId?: string;
  restaurantId?: string;
}

export interface OrderSummaryStats {
  allOrders: { count: number; total: number };
  cashOrders: { count: number; total: number };
  cardOrders: { count: number; total: number };
  paidOrders: { count: number; total: number };
  splitPaymentOrders: { count: number; total: number };
  discountOrders: { count: number; total: number };
  deliveryOrders: { count: number; total: number };
  serviceFeeOrders: { count: number; total: number };
  tipOrders: { count: number; total: number };
  inProgressOrders: { count: number; total: number };
  cancelledOrders: { count: number; total: number };
}

export interface OrderSummaryRow {
  employeeName: string;
  role: string;
  realizedOrders: OrderSummaryStats;
  unrealizedOrders: {
    inProgress: { count: number; total: number };
    cancelled: { count: number; total: number };
  };
}

export interface OrderSummaryResponse {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  ordersByType: Record<string, number>;
  ordersByPaymentMethod: Record<string, number>;
  topEmployees: Array<{
    id: string;
    name: string;
    orderCount: number;
    revenue: number;
  }>;
  // Nowe szczegółowe metryki
  completedOrders: {
    all: { count: number; total: number };
    cash: { count: number; total: number };
    card: { count: number; total: number };
    paid: { count: number; total: number };
    discounts: { count: number; total: number };
    deliveries: { count: number; total: number };
    serviceFees: { count: number; total: number };
    tips: { count: number; total: number };
  };
  uncompletedOrders: {
    inProgress: { count: number; total: number };
    cancelled: { count: number; total: number };
  };
  employeeData: Array<{
    id: string;
    name: string;
    role: string;
    completedOrders: {
      all: { count: number; total: number };
      cash: { count: number; total: number };
      card: { count: number; total: number };
      paid: { count: number; total: number };
      discounts: { count: number; total: number };
      deliveries: { count: number; total: number };
      serviceFees: { count: number; total: number };
      tips: { count: number; total: number };
    };
    uncompletedOrders: {
      inProgress: { count: number; total: number };
      cancelled: { count: number; total: number };
    };
  }>;
}

// Quote types
export interface QuoteRequest {
  dishId: string;
  sizeId: string;
  selections: Array<{
    groupId: string;
    itemIds: string[];
    qty: number;
  }>;
}

export interface QuoteResponse {
  dishPrice: number;
  addonPrice: number;
  totalPrice: number;
  vatAmount: number;
  finalPrice: number;
  breakdown: {
    dish: {
      name: string;
      size: string;
      price: number;
    };
    addons: Array<{
      groupName: string;
      items: Array<{
        name: string;
        price: number;
      }>;
    }>;
  };
}

// Validation schemas
export const QuoteRequestSchema = z.object({
  dishId: z.string(),
  sizeId: z.string(),
  selections: z.array(z.object({
    groupId: z.string(),
    itemIds: z.array(z.string()),
    qty: z.number()
  }))
});

// Fixed CreateOrderRequestSchema with conditional validation
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
}).refine((data) => {
  // For DELIVERY orders, address is required
  if (data.type === OrderType.DELIVERY) {
    return data.customer.address && 
           data.customer.address.street && 
           data.customer.address.city && 
           data.customer.address.postalCode;
  }
  return true;
}, {
  message: "Address is required for delivery orders",
  path: ["customer", "address"]
});

export const OrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: z.nativeEnum(OrderStatus),
  type: z.nativeEnum(OrderType),
  customer: z.object({
    id: z.string(),
    name: z.string(),
    phone: z.string(),
    email: z.string().optional(),
    address: z.object({
      id: z.string(),
      street: z.string(),
      city: z.string(),
      postalCode: z.string(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }).optional().nullable(),
  }),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number(),
    price: z.number(),
    total: z.number(),
    addons: z.any().optional().nullable(),
    ingredients: z.any().optional().nullable(),
    addedIngredients: z.any().optional().nullable(),
    removedIngredients: z.any().optional().nullable(),
    isHalfHalf: z.boolean().optional(),
    selectedSize: z.any().optional().nullable(),
    leftHalf: z.any().optional().nullable(),
    rightHalf: z.any().optional().nullable(),
    notes: z.string().optional().nullable(),
  })),
  total: z.number(),
  notes: z.string().optional().nullable(),
  tableNumber: z.string().optional().nullable(),
  promisedTime: z.number().optional().nullable(),
  createdAt: z.union([z.date(), z.string()]).transform((val) => typeof val === 'string' ? new Date(val) : val),
  updatedAt: z.union([z.date(), z.string()]).transform((val) => typeof val === 'string' ? new Date(val) : val),
});

export const UpdateOrderStatusRequestSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  completedBy: z.object({
    id: z.string(),
    name: z.string(),
    role: z.nativeEnum(EmployeeRole),
  }).optional(),
});

export const AssignEmployeeRequestSchema = z.object({
  employeeId: z.string().min(1),
});

export const OrdersFiltersSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  type: z.nativeEnum(OrderType).optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  assignedEmployeeId: z.string().optional(),
  page: z.number().positive().optional(),
  limit: z.number().positive().max(100).optional(),
});