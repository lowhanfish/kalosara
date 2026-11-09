import type { RequestHandler } from 'express';

export const privateNoStore: RequestHandler = (_req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store');
  next();
};

export const noStore: RequestHandler = (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
};

export const sensitiveApiCacheGuard: RequestHandler = (req, res, next) => {
  if (/^\/api\/v1\/(?:auth|account|admin)(?:\/|$)/.test(req.path)) {
    res.setHeader('Cache-Control', 'private, no-store');
  }
  next();
};
