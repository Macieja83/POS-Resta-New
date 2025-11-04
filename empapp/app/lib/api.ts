// API Client for EmpApp
const API_BASE_URL = 'http://localhost:4000/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  token?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

export interface LoginRequest {
  loginCode?: string;
  email?: string;
}

export interface LoginResponse {
  success: boolean;
  data?: User;
  token?: string;
  error?: string;
}

export interface Address {
  street?: string;
  city?: string;
  postalCode?: string;
  comment?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  type: 'DELIVERY' | 'TAKEAWAY' | 'DINE_IN';
  total: number;
  items: OrderItem[];
  customer: {
    name: string;
    phone: string;
    address?: string | Address;
  };
  delivery?: {
    address?: string | Address | null;
  } | null;
  deliveryAddress?: string | Address | null;
  assignedEmployeeId?: string;
  paymentMethod?: string;
  promisedTime?: number; // Czas realizacji zamówienia w minutach
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface OrdersResponse {
  data: Order[];
  pagination?: {
    limit: number;
    page: number;
    hasMore: boolean;
    total: number;
  };
}

class ApiClient {
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken') || localStorage.getItem('token');
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getAuthToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error('[API] Request failed:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('[API] Network error - check if backend is running on', API_BASE_URL);
      }
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();

// Auth API
export const authApi = {
  login: async (loginCode?: string, email?: string): Promise<LoginResponse> => {
    const body: LoginRequest = {};
    if (loginCode) body.loginCode = loginCode;
    if (email) body.email = email;
    return apiClient.post<LoginResponse>('/auth/login', body);
  },

  logout: async (): Promise<ApiResponse<void>> => {
    return apiClient.post<ApiResponse<void>>('/auth/logout', {});
  },
};

// Orders API
export const ordersApi = {
  getAvailableOrders: async (limit: number = 20, page: number = 1): Promise<ApiResponse<Order[]>> => {
    const response = await apiClient.get<ApiResponse<{ data: Order[]; pagination?: any }>>(`/orders/available?limit=${limit}&page=${page}`);
    // Backend returns { success: true, data: Order[], pagination: {...} }
    // We need to adapt it to our expected format
    if (response.success && Array.isArray(response.data)) {
      return {
        success: true,
        data: response.data,
      };
    }
    return {
      success: response.success,
      data: response.data?.data || [],
    };
  },

  getMyOrders: async (limit: number = 20, page: number = 1): Promise<ApiResponse<OrdersResponse>> => {
    const response = await apiClient.get<ApiResponse<Order[]>>(`/orders/my-orders?limit=${limit}&page=${page}`);
    // Backend returns { success: true, data: Order[], pagination: {...} }
    // We need to adapt it to our expected format
    if (response.success && Array.isArray(response.data)) {
      return {
        success: true,
        data: {
          data: response.data,
          pagination: (response as any).pagination,
        },
      };
    }
    return {
      success: response.success,
      data: {
        data: [],
        pagination: { limit, page, hasMore: false, total: 0 },
      },
    };
  },

  claimOrder: async (orderId: string): Promise<ApiResponse<Order>> => {
    return apiClient.post<ApiResponse<Order>>(`/orders/${orderId}/claim`, {});
  },

  updateOrderStatus: async (
    orderId: string,
    payload: {
      status?: string;
      paymentMethod?: string;
      completedBy?: { id?: string; name?: string; role?: string } | null;
      [key: string]: any;
    }
  ): Promise<ApiResponse<Order>> => {
    const body = { ...payload };
    if (body.paymentMethod === '') {
      delete body.paymentMethod;
    }
    return apiClient.patch<ApiResponse<Order>>(`/orders/${orderId}/status`, body);
  },

  getOrderHistory: async (limit: number = 100, page: number = 1): Promise<ApiResponse<OrdersResponse>> => {
    const response = await apiClient.get<ApiResponse<Order[]>>(`/orders/history?limit=${limit}&page=${page}`);
    // Backend returns { success: true, data: Order[], pagination: {...} }
    // We need to adapt it to our expected format
    if (response.success && Array.isArray(response.data)) {
      return {
        success: true,
        data: {
          data: response.data,
          pagination: (response as any).pagination,
        },
      };
    }
    return {
      success: response.success,
      data: {
        data: [],
        pagination: { limit, page, hasMore: false, total: 0 },
      },
    };
  },

  getPaymentStats: async (): Promise<ApiResponse<{
    total: number;
    cash: number;
    card: number;
    paid: number;
    totalCash: number;
    totalCard: number;
    totalPaid: number;
    totalAmount: number;
  }>> => {
    return apiClient.get<ApiResponse<{
      total: number;
      cash: number;
      card: number;
      paid: number;
      totalCash: number;
      totalCard: number;
      totalPaid: number;
      totalAmount: number;
    }>>(`/orders/payment-stats`);
  },
};

export const driverApi = {
  updateLocation: async (latitude: number, longitude: number, orderId?: string): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>('/driver/location', {
      latitude,
      longitude,
      orderId,
    });
  },
  stopLocation: async (): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>('/driver/location/stop', {});
  },
};
