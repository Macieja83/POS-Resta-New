import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-change-this-in-production';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Warning for short secrets in production
if (process.env.NODE_ENV === 'production' && JWT_SECRET.length < 32) {
  console.warn('⚠️ WARNING: JWT_SECRET should be at least 32 characters long for security in production');
}

export const generateToken = (payload: { id: string; email: string; role: string }): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  console.log('🔐 Auth verification:', {
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    endpoint: req.path,
    method: req.method
  });
  
  if (!token) {
    console.error('❌ No token provided for:', req.path);
    return res.status(401).json({ success: false, error: 'Brak tokenu autoryzacji' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    console.log('✅ Token verified for user:', { id: decoded.id, email: decoded.email, role: decoded.role });
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    void error;
    return res.status(401).json({ success: false, error: 'Nieprawidłowy token' });
  }
};

// Optional token verification - doesn't fail if no token (for backward compatibility with POS app)
export const verifyTokenOptional = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    console.log('ℹ️ No token provided (optional auth), continuing without user');
    req.user = undefined;
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    console.log('✅ Optional token verified for user:', { id: decoded.id, email: decoded.email, role: decoded.role });
    req.user = decoded;
    next();
  } catch (error) {
    console.log('ℹ️ Token verification failed (optional auth), continuing without user');
    req.user = undefined;
    next();
  }
};

































