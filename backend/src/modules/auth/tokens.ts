import { createHash, randomBytes } from 'node:crypto';
import { jwtVerify, SignJWT, errors } from 'jose';
import { env } from '../../config/env.js';
import { AccessError } from './authorization.js';

export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const issuer = 'kalosara-api';
const audience = 'kalosara-web';

function loadKeys(): Array<{ kid: string; key: Uint8Array }> {
  if (!env.AUTH_SIGNING_KEYS) return [{ kid: 'development', key: randomBytes(32) }];
  const entries = env.AUTH_SIGNING_KEYS.split(',').map((entry) => {
    const [kid, encoded, extra] = entry.split(':');
    if (!kid || !/^[a-zA-Z0-9_-]{1,32}$/.test(kid) || !encoded || extra || !/^[A-Za-z0-9_-]+$/.test(encoded)) {
      throw new Error('Invalid AUTH_SIGNING_KEYS format');
    }
    const key = Buffer.from(encoded, 'base64url');
    if (key.length < 32) throw new Error('AUTH_SIGNING_KEYS entries must contain at least 32 random bytes');
    return { kid, key };
  });
  if (new Set(entries.map(({ kid }) => kid)).size !== entries.length) throw new Error('Duplicate signing key id');
  return entries;
}

const keys = loadKeys();

export function newRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

export function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function signAccessToken(userId: string, sessionId: string, sessionExpiresAt: Date): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiration = Math.min(now + ACCESS_TTL_SECONDS, Math.floor(sessionExpiresAt.getTime() / 1000));
  if (expiration <= now) throw new AccessError(401, 'SESSION_REVOKED', 'Session expired');
  return new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: 'HS256', kid: keys[0].kid, typ: 'JWT' })
    .setIssuer(issuer).setAudience(audience).setSubject(userId)
    .setIssuedAt(now).setExpirationTime(expiration)
    .sign(keys[0].key);
}

export async function verifyAccessToken(token: string): Promise<{ userId: string; sessionId: string }> {
  try {
    const { payload } = await jwtVerify(token, (header) => {
      const entry = keys.find(({ kid }) => kid === header.kid);
      if (!entry || header.alg !== 'HS256') throw new Error('Unknown signing key');
      return entry.key;
    }, { issuer, audience, algorithms: ['HS256'] });
    if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') throw new Error('Invalid token claims');
    return { userId: payload.sub, sessionId: payload.sid };
  } catch (error) {
    if (error instanceof errors.JWTExpired) throw new AccessError(401, 'TOKEN_EXPIRED', 'Access token expired');
    throw new AccessError(401, 'UNAUTHENTICATED', 'Invalid access token');
  }
}
