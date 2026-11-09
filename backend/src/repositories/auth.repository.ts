import { prisma } from '../lib/prisma.js';
import { AccessError } from '../lib/errors.js';
import { lockAccount } from './common.repository.js';

export type NewPublicAccount = {
  email: string;
  phone?: string;
  passwordHash: string;
  role: 'MASYARAKAT';
  displayName?: string;
};

export interface PublicAccountRepository {
  create(
    data: NewPublicAccount,
  ): Promise<{ id: string; email: string; role: 'MASYARAKAT' }>;
}

export const prismaPublicAccountRepository: PublicAccountRepository = {
  async create(data) {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash: data.passwordHash,
        role: data.role,
        profile: data.displayName
          ? { create: { displayName: data.displayName } }
          : undefined,
      },
      select: { id: true, email: true, role: true },
    });
    return { id: user.id, email: user.email, role: 'MASYARAKAT' };
  },
};

export async function findRefreshSessionById(sessionId: string) {
  return prisma.refreshSession.findUnique({
    where: { id: sessionId },
    select: { userId: true, revokedAt: true, expiresAt: true },
  });
}

export async function findPrincipalById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true },
  });
}

export async function findAuthenticatedUserProfile(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      verifiedAt: true,
      createdAt: true,
      profile: { select: { displayName: true } },
    },
  });
}

export async function findUserByEmailInsensitive(email: string) {
  return prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });
}

export async function createLoginSessionTransaction(params: {
  userId: string;
  expectedPasswordHash: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string;
}) {
  return prisma.$transaction(
    async (tx) => {
      await lockAccount(tx, params.userId);
      const current = await tx.user.findUniqueOrThrow({
        where: { id: params.userId },
      });
      if (
        !current.isActive ||
        current.passwordHash !== params.expectedPasswordHash
      ) {
        throw new AccessError(
          403,
          'ACCOUNT_CHANGED',
          'Account changed; sign in again',
        );
      }
      const session = await tx.refreshSession.create({
        data: {
          userId: current.id,
          tokenHash: params.tokenHash,
          expiresAt: params.expiresAt,
          userAgent: params.userAgent,
        },
      });
      return { session, current };
    },
    { isolationLevel: 'ReadCommitted' },
  );
}

export async function findRefreshSessionByTokenHash(hash: string) {
  return prisma.refreshSession.findUnique({
    where: { tokenHash: hash },
    include: { user: { select: { isActive: true } } },
  });
}

export async function rotateRefreshSessionTransaction(params: {
  oldSessionId: string;
  userId: string;
  now: Date;
  newTokenHash: string;
  expiresAt: Date;
  userAgent?: string;
}) {
  return prisma.$transaction(
    async (tx) => {
      await lockAccount(tx, params.userId);
      const current = await tx.user.findUniqueOrThrow({
        where: { id: params.userId },
      });
      if (!current.isActive) {
        throw new AccessError(403, 'ACCOUNT_INACTIVE', 'Account is inactive');
      }
      const updated = await tx.refreshSession.updateMany({
        where: {
          id: params.oldSessionId,
          revokedAt: null,
          rotatedAt: null,
          expiresAt: { gt: params.now },
        },
        data: { revokedAt: params.now, rotatedAt: params.now },
      });
      if (updated.count !== 1) return null;
      return tx.refreshSession.create({
        data: {
          userId: params.userId,
          tokenHash: params.newTokenHash,
          expiresAt: params.expiresAt,
          userAgent: params.userAgent,
        },
      });
    },
    { isolationLevel: 'ReadCommitted' },
  );
}

export async function revokeAllUserRefreshSessions(userId: string) {
  await prisma.refreshSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeRefreshSessionByTokenHash(hash: string) {
  await prisma.refreshSession.updateMany({
    where: { tokenHash: hash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
