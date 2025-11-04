// Local types for backend - simplified version of shared types

export enum OrderStatus {
  OPEN = 'OPEN',
  PENDING = 'PENDING',
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

export interface OrdersFilters {
  status?: OrderStatus | OrderStatus[];
  type?: OrderType;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  assignedEmployeeId?: string;
  page?: number;
  limit?: number;
}

export type OrdersFiltersInput = OrdersFilters;
export type CreateOrderInput = any; // Will be defined by Prisma
export type UpdateOrderStatusInput = {
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  completedBy?: {
    id?: string;
    name?: string;
    role?: EmployeeRole;
  };
};

export interface OrderSummaryFilters {
  dateFrom?: string;
  dateTo?: string;
  employeeId?: string;
  restaurantId?: string;
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

export interface ApiError {
  status: number;
  message: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

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
  dishId: string;
  sizeId: string;
  basePrice: number;
  addonPrice: number;
  totalPrice: number;
  vatAmount: number;
  finalPrice: number;
  breakdown: {
    dish: {
      name: string;
      price: number;
    };
    size: {
      name: string;
      price: number;
    };
    addons: Array<{
      groupName: string;
      items: Array<{
        name: string;
        price: number;
        quantity: number;
        total: number;
      }>;
      total: number;
    }>;
  };
}
