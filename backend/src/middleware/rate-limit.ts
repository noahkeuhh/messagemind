import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { config } from '../config/index.js';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function rateLimit(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!config.rateLimit.enabled) {
    return next();
  }

  const userId = req.user?.id || req.ip || 'anonymous';
  const key = `rate_limit:${userId}`;
  const now = Date.now();

  // Clean expired entries periodically
  if (Math.random() < 0.01) {
    // 1% chance to clean
    Object.keys(store).forEach(k => {
      if (store[k].resetTime < now) {
        delete store[k];
      }
    });
  }

  const record = store[key];

  if (!record || record.resetTime < now) {
    // New window
    store[key] = {
      count: 1,
      resetTime: now + config.rateLimit.windowMs,
    };
    return next();
  }

  if (record.count >= config.rateLimit.maxRequests) {
    return res.status(429).json({
      error: 'rate_limit_exceeded',
      message: `Too many requests. Limit: ${config.rateLimit.maxRequests} per ${config.rateLimit.windowMs / 1000} seconds`,
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    });
  }

  record.count++;
  next();
}


