import { apiClient } from './client';

export interface UploadResponse {
  success: boolean;
  data?: {
    filename: string;
    originalName: string;
    path: string;
    size: number;
    mimetype: string;
  };
  error?: string;
}

export const uploadApi = {
  // Upload image file
  uploadImage: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData,
    });

    return response.json();
  },

  // Delete uploaded image
  deleteImage: async (filename: string): Promise<{ success: boolean; error?: string }> => {
    const response = await fetch(`/api/upload/image/${filename}`, {
      method: 'DELETE',
    });

    return response.json();
  }
};











