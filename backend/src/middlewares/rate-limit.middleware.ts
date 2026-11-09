import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';

export function createRateLimiter(options: {
  windowMs: number;
  limit: number;
  code?: string;
  message?: string;
}): RequestHandler {
  const {
    windowMs,
    limit,
    code = 'RATE_LIMITED',
    message = 'Too many requests',
  } = options;
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: { code, message },
        requestId: req.id,
      });
    },
  });
}
