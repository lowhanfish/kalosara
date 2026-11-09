import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { CookieOptions, Request, Response } from 'express';
import { errors, jwtVerify, SignJWT } from 'jose';
import { env } from '../config/env.js';
import { AccessError } from '../lib/errors.js';
import {
  loginSchema,
  publicRegistrationSchema,
} from '../validators/auth.validator.js';
import {
  createLoginSessionTransaction,
  findAuthenticatedUserProfile,
  findRefreshSessionByTokenHash,
  findUserByEmailInsensitive,
  prismaPublicAccountRepository,
  revokeAllUserRefreshSessions,
  revokeRefreshSessionByTokenHash,
  rotateRefreshSessionTransaction,
  type PublicAccountRepository,
} from '../repositories/auth.repository.js';

export type { PublicAccountRepository };

export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const ACCESS_COOKIE = 'kalosara_access';
export const REFRESH_COOKIE = 'kalosara_refresh';
export const CSRF_COOKIE = 'kalosara_csrf';

const issuer = 'kalosara-api';
const audience = 'kalosara-web';
const raceGraceMs = 3_000;

export function hashPassword(password: string): Promise<string> {
  return hash(password, env.PASSWORD_BCRYPT_COST);
}

export function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(password, passwordHash);
}

const dummyHash = hashPassword(randomBytes(24).toString('base64url'));

function loadKeys(): Array<{ kid: string; key: Uint8Array }> {
  if (!env.AUTH_SIGNING_KEYS)
    return [{ kid: 'development', key: randomBytes(32) }];
  const entries = env.AUTH_SIGNING_KEYS.split(',').map((entry) => {
    const [kid, encoded, extra] = entry.split(':');
    if (
      !kid ||
      !/^[a-zA-Z0-9_-]{1,32}$/.test(kid) ||
      !encoded ||
      extra ||
      !/^[A-Za-z0-9_-]+$/.test(encoded)
    ) {
      throw new Error('Invalid AUTH_SIGNING_KEYS format');
    }
    const key = Buffer.from(encoded, 'base64url');
    if (key.length < 32) {
      throw new Error(
        'AUTH_SIGNING_KEYS entries must contain at least 32 random bytes',
      );
    }
    return { kid, key };
  });
  if (new Set(entries.map(({ kid }) => kid)).size !== entries.length) {
    throw new Error('Duplicate signing key id');
  }
  return entries;
}

const keys = loadKeys();

export function newRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

export function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function signAccessToken(
  userId: string,
  sessionId: string,
  sessionExpiresAt: Date,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiration = Math.min(
    now + ACCESS_TTL_SECONDS,
    Math.floor(sessionExpiresAt.getTime() / 1000),
  );
  if (expiration <= now)
    throw new AccessError(401, 'SESSION_REVOKED', 'Session expired');
  return new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: 'HS256', kid: keys[0].kid, typ: 'JWT' })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(userId)
    .setIssuedAt(now)
    .setExpirationTime(expiration)
    .sign(keys[0].key);
}

export async function verifyAccessToken(
  token: string,
): Promise<{ userId: string; sessionId: string }> {
  try {
    const { payload } = await jwtVerify(
      token,
      (header) => {
        const entry = keys.find(({ kid }) => kid === header.kid);
        if (!entry || header.alg !== 'HS256')
          throw new Error('Unknown signing key');
        return entry.key;
      },
      { issuer, audience, algorithms: ['HS256'] },
    );
    if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') {
      throw new Error('Invalid token claims');
    }
    return { userId: payload.sub, sessionId: payload.sid };
  } catch (error) {
    if (error instanceof errors.JWTExpired) {
      throw new AccessError(401, 'TOKEN_EXPIRED', 'Access token expired');
    }
    throw new AccessError(401, 'UNAUTHENTICATED', 'Invalid access token');
  }
}

export function authCookieOptions(
  path: string,
  httpOnly = true,
  origin = env.APP_ORIGIN,
): CookieOptions {
  return {
    httpOnly,
    secure: new URL(origin).protocol === 'https:',
    sameSite: 'strict',
    path,
  };
}

export function setSessionCookies(
  res: Response,
  access: string,
  refresh: string,
  refreshExpiresAt: Date,
): void {
  res.cookie(ACCESS_COOKIE, access, {
    ...authCookieOptions('/api/v1'),
    maxAge: ACCESS_TTL_SECONDS * 1000,
  });
  res.cookie(REFRESH_COOKIE, refresh, {
    ...authCookieOptions('/api/v1/auth'),
    maxAge: Math.max(
      0,
      Math.min(REFRESH_TTL_MS, refreshExpiresAt.getTime() - Date.now()),
    ),
  });
}

export function clearSessionCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, authCookieOptions('/api/v1'));
  res.clearCookie(REFRESH_COOKIE, authCookieOptions('/api/v1/auth'));
}

export function issueCsrf(res: Response): string {
  const token = randomBytes(32).toString('base64url');
  res.cookie(CSRF_COOKIE, token, {
    ...authCookieOptions('/api/v1', false),
    maxAge: REFRESH_TTL_MS,
  });
  return token;
}

function equalToken(left: unknown, right: unknown): boolean {
  if (
    typeof left !== 'string' ||
    typeof right !== 'string' ||
    !/^[A-Za-z0-9_-]{43}$/.test(left) ||
    left.length !== right.length
  ) {
    return false;
  }
  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

export function validateMutation(req: Request): void {
  const origin = req.get('origin');
  const allowed =
    env.NODE_ENV === 'development'
      ? [
          env.APP_ORIGIN,
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
        ]
      : [env.APP_ORIGIN];
  if (!origin || !allowed.includes(origin)) {
    throw new AccessError(403, 'ORIGIN_FORBIDDEN', 'Origin is not allowed');
  }
  if (!equalToken(req.cookies?.[CSRF_COOKIE], req.get('x-csrf-token'))) {
    throw new AccessError(
      403,
      'CSRF_INVALID',
      'CSRF token is missing or invalid',
    );
  }
}

export async function registerPublicAccount(
  input: unknown,
  dependencies: {
    repository?: PublicAccountRepository;
    hash?: (password: string) => Promise<string>;
  } = {},
) {
  const parsed = publicRegistrationSchema.parse(input);
  const passwordHash = await (dependencies.hash ?? hashPassword)(
    parsed.password,
  );
  return (dependencies.repository ?? prismaPublicAccountRepository).create({
    email: parsed.email,
    phone: parsed.phone,
    passwordHash,
    role: 'MASYARAKAT',
    displayName: parsed.displayName,
  });
}

function extractUserAgent(req: Request): string | undefined {
  return req.get('user-agent')?.slice(0, 255);
}

export async function login(input: unknown, req: Request) {
  const parsed = loginSchema.parse(input);
  const user = await findUserByEmailInsensitive(parsed.email);
  const hashValue = user?.passwordHash ?? (await dummyHash);
  if (!(await verifyPassword(parsed.password, hashValue)) || !user) {
    throw new AccessError(401, 'UNAUTHENTICATED', 'Invalid email or password');
  }
  if (!user.isActive) {
    throw new AccessError(403, 'ACCOUNT_INACTIVE', 'Account is inactive');
  }
  const refresh = newRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  const { session, current } = await createLoginSessionTransaction({
    userId: user.id,
    expectedPasswordHash: user.passwordHash,
    tokenHash: tokenHash(refresh),
    expiresAt,
    userAgent: extractUserAgent(req),
  });
  const access = await signAccessToken(current.id, session.id, expiresAt);
  return {
    access,
    refresh,
    expiresAt,
    user: { id: current.id, email: current.email, role: current.role },
  };
}

async function rejectReusedSession(userId: string, rotatedAt: Date | null) {
  if (!rotatedAt)
    throw new AccessError(401, 'SESSION_REVOKED', 'Session revoked');
  if (Date.now() - rotatedAt.getTime() <= raceGraceMs) {
    throw new AccessError(409, 'REFRESH_RACE', 'Refresh already in progress');
  }
  await revokeAllUserRefreshSessions(userId);
  throw new AccessError(401, 'SESSION_REVOKED', 'Session revoked');
}

export async function refreshSession(rawToken: unknown, req: Request) {
  if (typeof rawToken !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(rawToken)) {
    throw new AccessError(401, 'UNAUTHENTICATED', 'Refresh token required');
  }
  const old = await findRefreshSessionByTokenHash(tokenHash(rawToken));
  if (!old)
    throw new AccessError(401, 'UNAUTHENTICATED', 'Invalid refresh token');
  if (old.revokedAt) await rejectReusedSession(old.userId, old.rotatedAt);
  if (!old.user.isActive)
    throw new AccessError(403, 'ACCOUNT_INACTIVE', 'Account is inactive');
  const now = new Date();
  if (old.expiresAt <= now)
    throw new AccessError(401, 'TOKEN_EXPIRED', 'Refresh token expired');
  const refresh = newRefreshToken();
  const result = await rotateRefreshSessionTransaction({
    oldSessionId: old.id,
    userId: old.userId,
    now,
    newTokenHash: tokenHash(refresh),
    expiresAt: old.expiresAt,
    userAgent: extractUserAgent(req),
  });
  if (!result)
    throw new AccessError(409, 'REFRESH_RACE', 'Refresh already in progress');
  const access = await signAccessToken(old.userId, result.id, result.expiresAt);
  return { access, refresh, expiresAt: result.expiresAt };
}

export async function logout(rawToken: unknown): Promise<void> {
  if (typeof rawToken !== 'string') return;
  await revokeRefreshSessionByTokenHash(tokenHash(rawToken));
}

export async function logoutAll(userId: string): Promise<void> {
  await revokeAllUserRefreshSessions(userId);
}

export async function getCurrentAuthenticatedUser(userId: string) {
  return findAuthenticatedUserProfile(userId);
}
