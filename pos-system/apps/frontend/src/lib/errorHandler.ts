import { ValidationError } from '../types/shared';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors?: ValidationError[];

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true, errors?: ValidationError[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleApiError = (error: any): AppError => {
  // Handle different types of errors
  if (error instanceof AppError) {
    return error;
  }

  if (error.response) {
    // API error response
    const { status, data } = error.response;
    const message = data?.error || data?.message || 'API Error';
    const errors = data?.errors;
    
    console.error('API Error Response:', {
      status,
      data,
      url: error.config?.url,
      method: error.config?.method,
      timestamp: new Date().toISOString()
    });
    
    return new AppError(message, status, true, errors);
  } else if (error.request) {
    // Network error
    console.error('Network Error:', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      timestamp: new Date().toISOString()
    });
    
    return new AppError('Network error - please check your connection', 0, true);
  } else {
    // Other errors
    console.error('Unexpected Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return new AppError(error.message || 'An unexpected error occurred', 500, true);
  }
};

export const showErrorToast = (error: AppError | Error) => {
  const message = error instanceof AppError ? error.message : error.message;
  
  // You can integrate with your toast library here
  console.error('Error:', message);
  
  // For now, we'll use alert as fallback
  alert(`Error: ${message}`);
};

export const handleError = (error: any, showToast: boolean = true) => {
  const appError = handleApiError(error);
  
  if (showToast) {
    showErrorToast(appError);
  }
  
  return appError;
};

export const validateFormData = (data: any, schema: any): { isValid: boolean; errors: ValidationError[] } => {
  try {
    const result = schema.safeParse(data);
    
    if (!result.success) {
      const errors: ValidationError[] = result.error.errors.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return { isValid: false, errors };
    }
    
    return { isValid: true, errors: [] };
  } catch (error) {
    return { 
      isValid: false, 
      errors: [{ field: 'general', message: 'Validation error' }] 
    };
  }
};

export const formatValidationErrors = (errors: ValidationError[]): string => {
  return errors.map(err => `${err.field}: ${err.message}`).join(', ');
};

export const isNetworkError = (error: any): boolean => {
  return error.code === 'NETWORK_ERROR' || 
         error.message?.includes('Network Error') ||
         error.message?.includes('fetch');
};

export const isAuthError = (error: any): boolean => {
  return error.statusCode === 401 || 
         error.statusCode === 403 ||
         error.message?.includes('Unauthorized') ||
         error.message?.includes('Forbidden');
};

export const isValidationError = (error: any): boolean => {
  return error.statusCode === 400 || 
         error.errors?.length > 0 ||
         error.message?.includes('Validation');
};

export const isServerError = (error: any): boolean => {
  return error.statusCode >= 500 || 
         error.message?.includes('Internal Server Error') ||
         error.message?.includes('Database');
};

export const getErrorMessage = (error: any): string => {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

export const getErrorStatus = (error: any): number => {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  
  if (error.response?.status) {
    return error.response.status;
  }
  
  return 500;
};

export const getErrorDetails = (error: any): { message: string; status: number; errors?: ValidationError[] } => {
  return {
    message: getErrorMessage(error),
    status: getErrorStatus(error),
    errors: error.errors || error.response?.data?.errors
  };
};
