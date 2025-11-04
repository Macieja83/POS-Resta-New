// Local types for frontend - copied from shared package
export enum OrderStatus {
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  PENDING_ACCEPTANCE = 'PENDING_ACCEPTANCE',
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
  PAID = 'PAID',
}

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
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
  requestedPickupAt?: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  paymentMethod?: PaymentMethod;
  total?: number;
  promisedTime?: number; // Deklarowany czas realizacji w minutach
}

export interface OrderSummaryFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: OrderStatus;
  type?: OrderType;
  employeeId?: string;
  restaurantId?: string;
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
