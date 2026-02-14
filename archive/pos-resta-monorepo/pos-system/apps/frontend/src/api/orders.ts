import { apiClient } from './client';
import { 
  Order, 
  CreateOrderRequest, 
  UpdateOrderRequest,
  AssignEmployeeRequest,
  OrdersListResponse, 
  OrdersFilters,
  OrderSummaryFilters,
  OrderSummaryResponse,
  ApiResponse
} from '../types/shared';

export const ordersApi = {
  // Get orders with filters
  getOrders: (filters: OrdersFilters): Promise<ApiResponse<OrdersListResponse>> => {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.assignedEmployeeId) params.append('assignedEmployeeId', filters.assignedEmployeeId);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const endpoint = `/orders${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<ApiResponse<OrdersListResponse>>(endpoint);
  },

  // Get order by ID
  getOrderById: (id: string): Promise<ApiResponse<Order>> => {
    return apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
  },

  // Create new order
  createOrder: (data: CreateOrderRequest): Promise<ApiResponse<Order>> => {
    return apiClient.post<ApiResponse<Order>>('/orders', data);
  },

  // Create public order (from QR code)
  createPublicOrder: (data: {
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      addons?: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
      }>;
      ingredients?: Array<{
        id: string;
        name: string;
      }>;
      addedIngredients?: Array<{
        id: string;
        name: string;
        quantity?: number;
      }>;
      removedIngredients?: Array<{
        id: string;
        name: string;
      }>;
      isHalfHalf?: boolean;
      selectedSize?: { 
        name: string; 
        price: number; 
      };
      leftHalf?: {
        dishName: string;
        addons?: Array<{
          id: string;
          name: string;
          price: number;
          quantity: number;
        }>;
        addedIngredients?: Array<{
          id: string;
          name: string;
          quantity?: number;
        }>;
        removedIngredients?: Array<{
          id: string;
          name: string;
        }>;
      };
      rightHalf?: {
        dishName: string;
        addons?: Array<{
          id: string;
          name: string;
          price: number;
          quantity: number;
        }>;
        addedIngredients?: Array<{
          id: string;
          name: string;
          quantity?: number;
        }>;
        removedIngredients?: Array<{
          id: string;
          name: string;
        }>;
      };
    }>;
    customerName: string;
    customerPhone: string;
    tableNumber?: string;
    notes?: string;
  }): Promise<ApiResponse<Order>> => {
    return apiClient.post<ApiResponse<Order>>('/orders/public', data);
  },

  // Update order
  updateOrder: (id: string, data: UpdateOrderRequest): Promise<ApiResponse<Order>> => {
    return apiClient.put<ApiResponse<Order>>(`/orders/${id}`, data);
  },

  // Get orders with geolocation data
  getOrdersWithGeo: (): Promise<ApiResponse<Order[]>> => {
    return apiClient.get<ApiResponse<Order[]>>('/orders/geo');
  },

  // Get orders for map (minimal data)
  getOrdersForMap: (): Promise<ApiResponse<Order[]>> => {
    return apiClient.get<ApiResponse<Order[]>>('/orders/map');
  },

  // Get order summary
  getOrderSummary: (filters: OrderSummaryFilters): Promise<ApiResponse<OrderSummaryResponse>> => {
    const params = new URLSearchParams();
    
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.restaurantId) params.append('restaurantId', filters.restaurantId);

    const queryString = params.toString();
    const endpoint = `/orders/summary${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<ApiResponse<OrderSummaryResponse>>(endpoint);
  },

  // Employee app endpoints
  getAvailableOrders: (limit: number = 20, page: number = 1): Promise<ApiResponse<{
    data: Order[];
    pagination: {
      limit: number;
      page: number;
      hasMore: boolean;
      total: number;
    };
  }>> => {
    return apiClient.get<ApiResponse<{
      data: Order[];
      pagination: {
        limit: number;
        page: number;
        hasMore: boolean;
        total: number;
      };
    }>>(`/orders/available?limit=${limit}&page=${page}`);
  },

  getMyOrders: (limit: number = 20, page: number = 1): Promise<ApiResponse<{
    data: Order[];
    pagination: {
      limit: number;
      page: number;
      hasMore: boolean;
      total: number;
    };
  }>> => {
    return apiClient.get<ApiResponse<{
      data: Order[];
      pagination: {
        limit: number;
        page: number;
        hasMore: boolean;
        total: number;
      };
    }>>(`/orders/my-orders?limit=${limit}&page=${page}`);
  },

  claimOrder: (orderId: string): Promise<ApiResponse<Order>> => {
    return apiClient.post<ApiResponse<Order>>(`/orders/${orderId}/claim`, {});
  },

  // Assign employee to order
  assignEmployee: (orderId: string, data: AssignEmployeeRequest): Promise<ApiResponse<Order>> => {
    return apiClient.patch<ApiResponse<Order>>(`/orders/${orderId}/assign`, data);
  },

  // Unassign employee from order
  unassignEmployee: (orderId: string): Promise<ApiResponse<Order>> => {
    return apiClient.delete<ApiResponse<Order>>(`/orders/${orderId}/assign`);
  },

  // Update payment method (only - without changing status)
  updatePaymentMethod: (orderId: string, paymentMethod: string): Promise<ApiResponse<Order>> => {
    return apiClient.patch<ApiResponse<Order>>(`/orders/${orderId}/status`, {
      paymentMethod: paymentMethod || undefined // Convert empty string to undefined
    });
  },

  // Geocode existing orders without coordinates
  geocodeOrders: (): Promise<ApiResponse<{ message: string; geocodedCount: number }>> => {
    return apiClient.post<ApiResponse<{ message: string; geocodedCount: number }>>('/orders/geocode', {});
  },

  // Cancel an order
  cancelOrder: (orderId: string): Promise<ApiResponse<Order>> => {
    return apiClient.patch<ApiResponse<Order>>(`/orders/${orderId}/cancel`, {});
  },

  // Delete an order
  deleteOrder: (orderId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<ApiResponse<{ message: string }>>(`/orders/${orderId}`);
  },

  // Update order status
  updateOrderStatus: (orderId: string, status: string, paymentMethod?: string, completedBy?: any): Promise<ApiResponse<Order>> => {
    return apiClient.patch<ApiResponse<Order>>(`/orders/${orderId}/status`, { 
      status, 
      paymentMethod, 
      completedBy 
    });
  },

  // Restore order from historical status
  restoreOrder: (orderId: string): Promise<ApiResponse<Order>> => {
    return apiClient.patch<ApiResponse<Order>>(`/orders/${orderId}/restore`, {});
  },

  // Test endpoints for debugging
  getTestAvailableOrders: (limit: number = 20, page: number = 1): Promise<ApiResponse<{
    data: Order[];
    pagination: {
      limit: number;
      page: number;
      hasMore: boolean;
      total: number;
    };
  }>> => {
    return apiClient.get<ApiResponse<{
      data: Order[];
      pagination: {
        limit: number;
        page: number;
        hasMore: boolean;
        total: number;
      };
    }>>(`/orders/test/available?limit=${limit}&page=${page}`);
  },

  getTestMyOrders: (limit: number = 20, page: number = 1): Promise<ApiResponse<{
    data: Order[];
    pagination: {
      limit: number;
      page: number;
      hasMore: boolean;
      total: number;
    };
  }>> => {
    return apiClient.get<ApiResponse<{
      data: Order[];
      pagination: {
        limit: number;
        page: number;
        hasMore: boolean;
        total: number;
      };
    }>>(`/orders/test/my-orders?limit=${limit}&page=${page}`);
  },

  // Test login endpoint
  testLogin: (loginCode: string): Promise<ApiResponse<{
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string;
      role: string;
    };
  }>> => {
    return apiClient.post<ApiResponse<{
      token: string;
      user: {
        id: string;
        name: string;
        email: string;
        phone: string;
        role: string;
      };
    }>>('/orders/test/login', { loginCode });
  },

  // Mobile login endpoint
  mobileLogin: (loginCode: string): Promise<ApiResponse<{
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string;
      role: string;
    };
  }>> => {
    return apiClient.post<ApiResponse<{
      token: string;
      user: {
        id: string;
        name: string;
        email: string;
        phone: string;
        role: string;
      };
    }>>('/orders/mobile/login', { loginCode });
  },
};
