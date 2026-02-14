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

type ErrorLike = {
  message?: string;
  stack?: string;
  code?: string;
  statusCode?: number;
  errors?: ValidationError[];
  response?: {
    status?: number;
    data?: {
      error?: string;
      message?: string;
      errors?: ValidationError[];
    };
  };
  request?: unknown;
  config?: {
    url?: string;
    method?: string;
  };
};

const asErrorLike = (e: unknown): ErrorLike => (typeof e === 'object' && e !== null ? (e as ErrorLike) : {});

export const handleApiError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;

  const e = asErrorLike(error);

  if (e.response) {
    const status = e.response.status ?? 500;
    const data = e.response.data;
    const message = data?.error || data?.message || 'API Error';
    const errors = data?.errors;

    console.error('API Error Response:', {
      status,
      data,
      url: e.config?.url,
      method: e.config?.method,
      timestamp: new Date().toISOString()
    });

    return new AppError(message, status, true, errors);
  }

  if (e.request) {
    console.error('Network Error:', {
      message: e.message,
      code: e.code,
      url: e.config?.url,
      timestamp: new Date().toISOString()
    });

    return new AppError('Network error - please check your connection', 0, true);
  }

  console.error('Unexpected Error:', {
    message: e.message,
    stack: e.stack,
    timestamp: new Date().toISOString()
  });

  return new AppError(e.message || 'An unexpected error occurred', 500, true);
};

export const showErrorToast = (error: AppError | Error) => {
  const message = error instanceof AppError ? error.message : error.message;
  
  // You can integrate with your toast library here
  console.error('Error:', message);
  
  // For now, we'll use alert as fallback
  alert(`Error: ${message}`);
};

export const handleError = (error: unknown, showToast: boolean = true) => {
  const appError = handleApiError(error);
  
  if (showToast) {
    showErrorToast(appError);
  }
  
  return appError;
};

export const validateFormData = (
  data: unknown,
  schema: { safeParse: (input: unknown) => { success: boolean; error?: { errors: Array<{ path: Array<string | number>; message: string }> } } }
): { isValid: boolean; errors: ValidationError[] } => {
  try {
    const result = schema.safeParse(data);
    
    if (!result.success) {
      const errors: ValidationError[] = result.error.errors.map((err) => ({
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

export const isNetworkError = (error: unknown): boolean => {
  const e = asErrorLike(error);
  return e.code === 'NETWORK_ERROR' ||
    e.message?.includes('Network Error') ||
    e.message?.includes('fetch');
};

export const isAuthError = (error: unknown): boolean => {
  const e = asErrorLike(error);
  return e.statusCode === 401 ||
    e.statusCode === 403 ||
    e.message?.includes('Unauthorized') ||
    e.message?.includes('Forbidden');
};

export const isValidationError = (error: unknown): boolean => {
  const e = asErrorLike(error);
  return e.statusCode === 400 ||
    (e.errors?.length ?? 0) > 0 ||
    e.message?.includes('Validation');
};

export const isServerError = (error: unknown): boolean => {
  const e = asErrorLike(error);
  return (e.statusCode ?? 0) >= 500 ||
    e.message?.includes('Internal Server Error') ||
    e.message?.includes('Database');
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) return error.message;

  const e = asErrorLike(error);

  if (e.response?.data?.error) return e.response.data.error;
  if (e.response?.data?.message) return e.response.data.message;
  if (e.message) return e.message;

  return 'An unexpected error occurred';
};

export const getErrorStatus = (error: unknown): number => {
  if (error instanceof AppError) return error.statusCode;

  const e = asErrorLike(error);
  if (e.response?.status) return e.response.status;

  return 500;
};

export const getErrorDetails = (error: unknown): { message: string; status: number; errors?: ValidationError[] } => {
  const e = asErrorLike(error);
  return {
    message: getErrorMessage(error),
    status: getErrorStatus(error),
    errors: e.errors || e.response?.data?.errors
  };
};
