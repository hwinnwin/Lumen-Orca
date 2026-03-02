import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
}

/**
 * JWT auth middleware — verifies Bearer token and sets req.userId.
 * Also accepts token from query param (for OAuth popup flows where
 * the browser navigates directly and can't send Authorization headers).
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid authorization' });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Generate a JWT token for a user.
 */
export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email } as JwtPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as string & jwt.SignOptions['expiresIn'],
  });
}
