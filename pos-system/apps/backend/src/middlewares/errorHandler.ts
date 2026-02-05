import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../types/local';

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

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: ValidationError[] | undefined;

  // Handle different types of errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errors = error.errors;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = [{
      field: 'general',
      message: error.message
    }];
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'MongoError' && (error as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    if (prismaError.code === 'P2002') {
      statusCode = 409;
      message = 'Duplicate field value';
    } else if (prismaError.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    } else if (prismaError.code === 'P2003') {
      statusCode = 400;
      message = 'Foreign key constraint failed';
    } else {
      statusCode = 400;
      message = 'Database error';
    }
  } else if (error.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Validation error';
  } else if (error.name === 'PrismaClientInitializationError') {
    statusCode = 500;
    message = 'Database connection error';
  } else if (error.name === 'PrismaClientRustPanicError') {
    statusCode = 500;
    message = 'Database panic error';
  } else if (error.name === 'PrismaClientUnknownRequestError') {
    statusCode = 500;
    message = 'Unknown database error';
  } else if (error.message && error.message.includes('timeout')) {
    statusCode = 504;
    message = 'Database request timeout - please try again';
  } else if (error.message && error.message.includes('ECONNREFUSED')) {
    statusCode = 503;
    message = 'Database connection refused - service unavailable';
  } else if (error.message && error.message.includes('ETIMEDOUT')) {
    statusCode = 504;
    message = 'Database connection timeout - please try again';
  } else if (process.env.NODE_ENV === 'development' && error.message) {
    message = error.message;
  }

  // Log error for debugging
  console.error('Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    statusCode,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    headers: {
      authorization: req.get('Authorization') ? 'present' : 'missing',
      contentType: req.get('Content-Type'),
      origin: req.get('Origin')
    }
  });

  // Send error response

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(errors && { errors })
  });
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, _res, next)).catch(next);
  };
};

export const validateRequest = (schema: any) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const errors: ValidationError[] = result.error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        const error = new AppError('Validation failed', 400, true, errors);
        return next(error);
      }
      
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateQuery = (schema: any) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.query);
      
      if (!result.success) {
        const errors: ValidationError[] = result.error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        const error = new AppError('Query validation failed', 400, true, errors);
        return next(error);
      }
      
      req.query = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateParams = (schema: any) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.params);
      
      if (!result.success) {
        const errors: ValidationError[] = result.error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        const error = new AppError('Parameter validation failed', 400, true, errors);
        return next(error);
      }
      
      req.params = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};