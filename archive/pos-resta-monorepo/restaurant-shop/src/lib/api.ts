import axios, { AxiosInstance } from 'axios';
import {
  CreateOrderRequest,
  CreateOrderRequestSchema,
  Order,
  OrderSchema,
  ApiResponse,
} from '@restaurant-shop/shared';

// Create axios instance with base configuration
const createApiClient = (): AxiosInstance => {
  const getApiUrl = () => {
    // Use local backend for development
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:4000/api';
    }
    
    // Use environment variable first, then fallback
    return process.env.NEXT_PUBLIC_API_URL || 'https://pos-system-backend.vercel.app/api';
  };
  
  const baseURL = getApiUrl();
  
  console.log('Restaurant Shop API URL:', baseURL);
  
  if (!baseURL) {
    throw new Error('API URL not configured. Please set NEXT_PUBLIC_API_URL in your .env file');
  }

  const apiClient = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor for logging
  apiClient.interceptors.request.use(
    (config) => {
      console.log('Restaurant Shop API Request:', config.method?.toUpperCase(), config.url);
      return config;
    },
    (error) => {
      console.error('Restaurant Shop API Request error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  apiClient.interceptors.response.use(
    (response) => {
      console.log('Restaurant Shop API Response:', response.status, response.config.url);
      return response;
    },
    (error) => {
      console.error('Restaurant Shop API Response error:', error.response?.status, error.config?.url, error.message);
      return Promise.reject(error);
    }
  );

  return apiClient;
};

// Create the API client instance
const apiClient = createApiClient();

// API functions for restaurant shop
export const createOrder = async (orderData: CreateOrderRequest): Promise<Order> => {
  console.log('Creating order from shop:', orderData);
  
  try {
    // Validate the request data
    const validatedData = CreateOrderRequestSchema.parse(orderData);
    
    // Send to the shop-specific endpoint which handles status mapping
    const response = await apiClient.post('/orders/from-shop', validatedData);
    console.log('Order creation response:', response.data);
    
    // Handle POS system response format
    const posResponse: ApiResponse<Order> = response.data;
    if (!posResponse.success) {
      throw new Error(`Failed to create order: ${posResponse.error || 'Unknown error'}`);
    }
    
    // Validate the response data with Zod schema
    const validatedOrder = OrderSchema.parse(posResponse.data);
    console.log('Created order:', validatedOrder);
    return validatedOrder;
  } catch (error) {
    console.error('Create order error:', error);
    throw error;
  }
};

export const getOrderById = async (id: string): Promise<Order> => {
  console.log('Fetching order with ID:', id);
  
  try {
    const response = await apiClient.get(`/orders/${id}`);
    console.log('Order fetch response:', response.data);
    
    // Handle POS system response format
    const posResponse: ApiResponse<Order> = response.data;
    if (!posResponse.success) {
      throw new Error(`Failed to fetch order: ${posResponse.error || 'Unknown error'}`);
    }
    
    // Validate the response data with Zod schema
    const validatedOrder = OrderSchema.parse(posResponse.data);
    console.log('Fetched order:', validatedOrder);
    return validatedOrder;
  } catch (error) {
    console.error('Fetch order error:', error);
    throw error;
  }
};

// Health check
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/health');
    return response.status === 200;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

// Export the API client for direct use if needed
export { apiClient };

// Export types for external use
export type {
  CreateOrderRequest,
  Order,
  ApiResponse,
} from '@restaurant-shop/shared';