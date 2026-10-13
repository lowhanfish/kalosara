import type { Request } from 'express';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';
import { AccessError } from './authorization.js';
import { signAccessToken, newRefreshToken, tokenHash, REFRESH_TTL_MS } from './tokens.js';
import { hashPassword, verifyPassword } from './password.js';
import { emailSchema } from './validation.js';

const raceGraceMs = 3_000;
const dummyHash = hashPassword(randomBytes(24).toString('base64url'));

function metadata(req: Request) {
  return { userAgent: req.get('user-agent')?.slice(0, 255) };
}

export async function login(input: unknown, req: Request) {
  const parsed = loginSchema.parse(input);
  const user = await prisma.user.findFirst({ where: { email: { equals: parsed.email, mode: 'insensitive' } } });
  const hash = user?.passwordHash ?? await dummyHash;
  if (!(await verifyPassword(parsed.password, hash)) || !user) {
    throw new AccessError(401, 'UNAUTHENTICATED', 'Invalid email or password');
  }
  if (!user.isActive) throw new AccessError(403, 'ACCOUNT_INACTIVE', 'Account is inactive');
  const refresh = newRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  const session = await prisma.refreshSession.create({
    data: { userId: user.id, tokenHash: tokenHash(refresh), expiresAt, ...metadata(req) },
  });
  const access = await signAccessToken(user.id, session.id, expiresAt);
  return { access, refresh, expiresAt, user: { id: user.id, email: user.email, role: user.role } };
}

async function rejectReusedSession(userId: string, rotatedAt: Date | null) {
  if (!rotatedAt) throw new AccessError(401, 'SESSION_REVOKED', 'Session revoked');
  if (rotatedAt && Date.now() - rotatedAt.getTime() <= raceGraceMs) {
    throw new AccessError(409, 'REFRESH_RACE', 'Refresh already in progress');
  }
  await prisma.refreshSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  throw new AccessError(401, 'SESSION_REVOKED', 'Session revoked');
}

export async function refreshSession(rawToken: unknown, req: Request) {
  if (typeof rawToken !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(rawToken)) {
    throw new AccessError(401, 'UNAUTHENTICATED', 'Refresh token required');
  }
  const old = await prisma.refreshSession.findUnique({
    where: { tokenHash: tokenHash(rawToken) },
    include: { user: { select: { isActive: true } } },
  });
  if (!old) throw new AccessError(401, 'UNAUTHENTICATED', 'Invalid refresh token');
  if (old.revokedAt) await rejectReusedSession(old.userId, old.rotatedAt);
  if (!old.user.isActive) throw new AccessError(403, 'ACCOUNT_INACTIVE', 'Account is inactive');
  const now = new Date();
  if (old.expiresAt <= now) throw new AccessError(401, 'TOKEN_EXPIRED', 'Refresh token expired');
  const refresh = newRefreshToken();
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.refreshSession.updateMany({
      where: { id: old.id, revokedAt: null, rotatedAt: null, expiresAt: { gt: now } },
      data: { revokedAt: now, rotatedAt: now },
    });
    if (updated.count !== 1) return null;
    const session = await tx.refreshSession.create({
      data: { userId: old.userId, tokenHash: tokenHash(refresh), expiresAt: old.expiresAt, ...metadata(req) },
    });
    return session;
  });
  if (!result) throw new AccessError(409, 'REFRESH_RACE', 'Refresh already in progress');
  const access = await signAccessToken(old.userId, result.id, result.expiresAt);
  return { access, refresh, expiresAt: result.expiresAt };
}

export async function logout(rawToken: unknown): Promise<void> {
  if (typeof rawToken !== 'string') return;
  await prisma.refreshSession.updateMany({
    where: { tokenHash: tokenHash(rawToken), revokedAt: null }, data: { revokedAt: new Date() },
  });
}

export async function logoutAll(userId: string): Promise<void> {
  await prisma.refreshSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
}

const loginSchema = z.object({ email: emailSchema, password: z.string().min(1) });
