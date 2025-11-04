import { apiClient } from './client';

export interface CompanySettings {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCompanySettingsRequest {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
}

export const settingsApi = {
  getCompanySettings: async () => {
    const response = await apiClient.get('/settings/company');
    return response as { success: boolean; data: CompanySettings | null };
  },

  updateCompanySettings: async (data: UpdateCompanySettingsRequest) => {
    const response = await apiClient.put('/settings/company', data);
    return response as { success: boolean; data: CompanySettings; message: string };
  },
};
