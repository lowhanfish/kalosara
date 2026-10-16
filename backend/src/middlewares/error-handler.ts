import type { ErrorRequestHandler, RequestHandler } from 'express';
import { CmsError } from '../modules/cms/common.js';
import { ZodError } from 'zod';
import { logger } from '../lib/logger.js';
import { AccessError } from '../modules/auth/authorization.js';

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Resource not found' }, requestId: req.id });
};

export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  void _next;
  if (error instanceof AccessError || error instanceof CmsError) {
    res.status(error.status).json({ success: false, error: { code: error.code, message: error.message }, requestId: req.id });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.flatten() }, requestId: req.id });
    return;
  }
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON body' }, requestId: req.id });
    return;
  }
  if (error instanceof Error && 'type' in error && error.type === 'entity.too.large') {
    res.status(413).json({ success: false, error: { code: 'BODY_TOO_LARGE', message: 'Request body too large' }, requestId: req.id });
    return;
  }
  logger.error({ err: error, requestId: req.id }, 'Unhandled request error');
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, requestId: req.id });
};
