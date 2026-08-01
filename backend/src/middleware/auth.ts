import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}

export interface AuthRequest extends Request {
  user?: { id: number; email: string; role: string };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = header.slice(7);
  try {
    const secret = process.env.NODE_ENV === 'production' ? process.env.JWT_SECRET! : (process.env.JWT_SECRET || 'devsecret');
    const payload = jwt.verify(token, secret) as { id: number; email: string; role: string };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
}
