import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    userType: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
    });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({
      success: false,
      error: 'JWT secret not configured',
    });
  }

  try {
    const decoded = jwt.verify(token, secret) as {
      id: number;
      username: string;
      userType: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  next();
};

// Optional authentication - decode token if present, but don't require it
// This allows routes to work with or without authentication
export const optionalAuthenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // If no token, just continue without user
  if (!token) {
    return next();
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // If JWT secret not configured, just continue
    return next();
  }

  try {
    const decoded = jwt.verify(token, secret) as {
      id: number;
      username: string;
      userType: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    // If token is invalid, just continue without user (don't return error)
    // This allows the route to work even with invalid/expired tokens
    next();
  }
};

