// In production, requests must go to backend. VITE_API_URL is set in Vercel env for frontend project.
// Fallback: when running on Vercel frontend domain without env, use known backend URL (rewrites are not applied when frontend project uses monorepo root vercel.json).
function getApiBaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_API_URL as string)?.trim()?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined' && window.location?.hostname?.includes('vercel.app')) {
    return 'https://pos-system-backend.vercel.app/api';
  }
  return '/api';
}
const API_BASE_URL = getApiBaseUrl();

export interface HealthResponse {
  status: string;
  timestamp: string;
  db: 'ok' | 'down';
  environment: string;
}

export class ApiClient {
  private getAuthToken(): string | null {
    // Try to get token from localStorage
    const employeeToken = localStorage.getItem('employeeToken');
    const authToken = localStorage.getItem('authToken');
    const token = employeeToken || authToken;
    console.log('ApiClient getAuthToken:', { 
      employeeToken: employeeToken ? 'found' : 'none', 
      authToken: authToken ? 'found' : 'none',
      finalToken: token ? 'found' : 'none'
    });
    return token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get auth token
    const token = this.getAuthToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    console.log('ApiClient request:', { url, hasToken: !!token, method: options.method || 'GET', token: token ? token.substring(0, 20) + '...' : 'none' });

    try {
      console.log('🌐 API Request:', { url, method: options.method || 'GET', hasToken: !!token });
      const response = await fetch(url, config);
      
      console.log('📡 API Response:', { 
        url, 
        status: response.status, 
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API Success:', { url, data });
      return data as Promise<T>;
    } catch (error) {
      console.error('💥 API Network Error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
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

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export const apiClient = new ApiClient();

export const healthApi = {
  getHealth: () => apiClient.get<HealthResponse>('/health'),
};
