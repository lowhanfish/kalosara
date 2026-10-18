import { AsyncLocalStorage } from 'node:async_hooks';
import { createHmac, randomBytes } from 'node:crypto';
import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
export const auditContext = new AsyncLocalStorage<{ requestId: string; ipHash: string }>();
const key = env.CACHE_INVALIDATION_SECRET ?? randomBytes(32);
// Daily pseudonym: correlates requests within one UTC day, never stores the raw IP.
export const attachAuditContext: RequestHandler = (req, _res, next) => {
  const ipHash = createHmac('sha256', key).update(`audit:${new Date().toISOString().slice(0, 10)}:${req.ip ?? ''}`).digest('hex');
  auditContext.run({ requestId: String(req.id), ipHash }, next);
};
