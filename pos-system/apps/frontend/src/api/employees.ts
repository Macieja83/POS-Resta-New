import { apiClient } from './client';
import { 
  Employee, 
  EmployeeRole,
  ApiResponse
} from '../types/shared';

export const employeesApi = {
  // Get all employees
  getEmployees: (): Promise<ApiResponse<Employee[]>> => {
    return apiClient.get<ApiResponse<Employee[]>>('/employees');
  },

  // Get all employees (including inactive)
  getAllEmployees: (): Promise<ApiResponse<Employee[]>> => {
    return apiClient.get<ApiResponse<Employee[]>>('/employees/all');
  },

  // Get all drivers
  getDrivers: (): Promise<ApiResponse<Employee[]>> => {
    return apiClient.get<ApiResponse<Employee[]>>('/employees/drivers');
  },

  // Get employee by ID
  getEmployeeById: (id: string): Promise<ApiResponse<Employee>> => {
    return apiClient.get<ApiResponse<Employee>>(`/employees/${id}`);
  },

  // Create new employee
  createEmployee: (data: {
    name: string;
    email: string;
    phone?: string;
    role: EmployeeRole;
    loginCode?: string;
  }): Promise<ApiResponse<Employee>> => {
    return apiClient.post<ApiResponse<Employee>>('/employees', data);
  },

  // Update employee
  updateEmployee: (id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    role?: EmployeeRole;
    loginCode?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<Employee>> => {
    return apiClient.put<ApiResponse<Employee>>(`/employees/${id}`, data);
  },

  // Generate new login code
  generateNewLoginCode: (id: string): Promise<ApiResponse<Employee>> => {
    return apiClient.post<ApiResponse<Employee>>(`/employees/${id}/generate-login-code`, {});
  },

  // Update login code
  updateLoginCode: (id: string, loginCode: string): Promise<ApiResponse<Employee>> => {
    return apiClient.put<ApiResponse<Employee>>(`/employees/${id}/login-code`, { loginCode });
  },

  // Delete employee
  deleteEmployee: (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<ApiResponse<{ message: string }>>(`/employees/${id}`);
  },

  // Login with code
  loginWithCode: (loginCode: string): Promise<ApiResponse<Employee> & { token: string }> => {
    return apiClient.post<ApiResponse<Employee> & { token: string }>('/employees/login', { loginCode });
  },

  // Get driver locations
  getDriverLocations: (): Promise<ApiResponse<unknown[]>> => {
    return apiClient.get<ApiResponse<unknown[]>>('/employees/locations');
  },

  // Update driver location
  updateDriverLocation: (data: {
    latitude: number;
    longitude: number;
    orderId?: string;
  }): Promise<ApiResponse<unknown>> => {
    return apiClient.post<ApiResponse<unknown>>('/employees/location', data);
  },
};
