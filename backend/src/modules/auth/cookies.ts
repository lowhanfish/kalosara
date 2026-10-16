import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { CookieOptions, Request, Response } from 'express';
import { env } from '../../config/env.js';
import { AccessError } from './authorization.js';
import { ACCESS_TTL_SECONDS, REFRESH_TTL_MS } from './tokens.js';

export const ACCESS_COOKIE = 'kalosara_access';
export const REFRESH_COOKIE = 'kalosara_refresh';
export const CSRF_COOKIE = 'kalosara_csrf';
export function authCookieOptions(path: string, httpOnly = true, origin = env.APP_ORIGIN): CookieOptions {
  return { httpOnly, secure: new URL(origin).protocol === 'https:', sameSite: 'strict', path };
}

export function setSessionCookies(res: Response, access: string, refresh: string, refreshExpiresAt: Date): void {
  res.cookie(ACCESS_COOKIE, access, { ...authCookieOptions('/api/v1'), maxAge: ACCESS_TTL_SECONDS * 1000 });
  res.cookie(REFRESH_COOKIE, refresh, { ...authCookieOptions('/api/v1/auth'), maxAge: Math.max(0, Math.min(REFRESH_TTL_MS, refreshExpiresAt.getTime() - Date.now())) });
}

export function clearSessionCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, authCookieOptions('/api/v1'));
  res.clearCookie(REFRESH_COOKIE, authCookieOptions('/api/v1/auth'));
}

export function issueCsrf(res: Response): string {
  const token = randomBytes(32).toString('base64url');
  res.cookie(CSRF_COOKIE, token, { ...authCookieOptions('/api/v1', false), maxAge: REFRESH_TTL_MS });
  return token;
}

function equalToken(left: unknown, right: unknown): boolean {
  if (typeof left !== 'string' || typeof right !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(left) || left.length !== right.length) return false;
  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

export function validateMutation(req: Request): void {
  if (req.get('origin') !== env.APP_ORIGIN) throw new AccessError(403, 'ORIGIN_FORBIDDEN', 'Origin is not allowed');
  if (!equalToken(req.cookies?.[CSRF_COOKIE], req.get('x-csrf-token'))) {
    throw new AccessError(403, 'CSRF_INVALID', 'CSRF token is missing or invalid');
  }
}
