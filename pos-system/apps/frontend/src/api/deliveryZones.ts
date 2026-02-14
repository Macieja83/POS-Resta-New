import { apiClient } from './client';

export interface DeliveryZone {
  id: string;
  name: string;
  coordinates: [number, number][];
  isActive: boolean;
  deliveryPrice: number; // in grosz (cents)
  minOrderValue: number; // in grosz (cents)
  freeDeliveryFrom?: number; // in grosz (cents)
  courierRate?: number; // in grosz (cents)
  area: number;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliveryZoneRequest {
  name: string;
  coordinates: [number, number][];
  isActive?: boolean;
  deliveryPrice: number; // in grosz (cents)
  minOrderValue: number; // in grosz (cents)
  freeDeliveryFrom?: number; // in grosz (cents)
  courierRate?: number; // in grosz (cents)
  area: number;
  color?: string;
}

export interface UpdateDeliveryZoneRequest extends Partial<CreateDeliveryZoneRequest> {}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown[];
}

export const deliveryZonesApi = {
  // Get all delivery zones
  getZones: (): Promise<ApiResponse<DeliveryZone[]>> => {
    return apiClient.get<ApiResponse<DeliveryZone[]>>('/delivery-zones');
  },

  // Get single delivery zone
  getZone: (id: string): Promise<ApiResponse<DeliveryZone>> => {
    return apiClient.get<ApiResponse<DeliveryZone>>(`/delivery-zones/${id}`);
  },

  // Create new delivery zone
  createZone: (zone: CreateDeliveryZoneRequest): Promise<ApiResponse<DeliveryZone>> => {
    return apiClient.post<ApiResponse<DeliveryZone>>('/delivery-zones', zone);
  },

  // Update delivery zone
  updateZone: (id: string, zone: UpdateDeliveryZoneRequest): Promise<ApiResponse<DeliveryZone>> => {
    return apiClient.put<ApiResponse<DeliveryZone>>(`/delivery-zones/${id}`, zone);
  },

  // Delete delivery zone
  deleteZone: (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(`/delivery-zones/${id}`);
  }
};




