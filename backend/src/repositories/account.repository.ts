import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { assertRole } from '../lib/authorization.js';
import { AccessError, CmsError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';
import { acquireAdminAdvisoryLock, lockAccount } from './common.repository.js';

export const ownAccountSelect = {
  id: true,
  email: true,
  phone: true,
  role: true,
  verifiedAt: true,
  updatedAt: true,
  profile: { select: { displayName: true, address: true } },
  contactChange: {
    select: {
      id: true,
      newEmail: true,
      newPhone: true,
      requestedAt: true,
      expiresAt: true,
    },
  },
} as const;

export async function assertActiveTransactionSession(
  tx: Prisma.TransactionClient,
  userId: string,
  sessionId: string,
) {
  const session = await tx.refreshSession.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== userId || session.revokedAt || session.expiresAt <= new Date()) {
    throw new AccessError(401, 'SESSION_REVOKED', 'Sesi sudah berakhir; masuk kembali');
  }
}

export async function runOwnAccountTransaction<T>(
  userId: string,
  sessionId: string,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      await lockAccount(tx, userId);
      assertRole(await tx.user.findUnique({ where: { id: userId } }), ['MASYARAKAT']);
      await assertActiveTransactionSession(tx, userId, sessionId);
      return work(tx);
    },
    { isolationLevel: 'ReadCommitted' },
  );
}

export async function findOwnAccountProfile(userId: string) {
  return prisma.user.findUniqueOrThrow({ where: { id: userId }, select: ownAccountSelect });
}

export async function findAccountUserById(userId: string) {
  return prisma.user.findUniqueOrThrow({ where: { id: userId } });
}

export async function updateOwnAccountProfileInTx(
  userId: string,
  sessionId: string,
  input: { displayName: string; address: string | null; expectedUpdatedAt: string },
) {
  return runOwnAccountTransaction(userId, sessionId, async (tx) => {
    const current = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (current.updatedAt.toISOString() !== input.expectedUpdatedAt) {
      throw new AccessError(409, 'CONFLICT', 'Profil berubah; muat ulang sebelum menyimpan');
    }
    await tx.userProfile.upsert({
      where: { userId },
      create: { userId, displayName: input.displayName, address: input.address || null },
      update: { displayName: input.displayName, address: input.address || null },
    });
    const user = await tx.user.update({
      where: { id: userId },
      data: { updatedAt: new Date() },
      select: ownAccountSelect,
    });
    await tx.auditLog.create({
      data: {
        actorId: userId,
        action: 'ACCOUNT_PROFILE_UPDATED',
        resourceType: 'AccountProfile',
        resourceId: userId,
      },
    });
    return user;
  });
}

export async function upsertOwnContactChangeInTx(params: {
  userId: string;
  sessionId: string;
  expectedPasswordHash: string;
  newEmail?: string;
  newPhone?: string;
  computeContactHash: (user: { email: string; phone: string | null }) => string;
}) {
  return runOwnAccountTransaction(params.userId, params.sessionId, async (tx) => {
    const current = await tx.user.findUniqueOrThrow({ where: { id: params.userId } });
    if (current.passwordHash !== params.expectedPasswordHash) {
      throw new AccessError(409, 'CONFLICT', 'Akun berubah; masuk kembali');
    }
    const newEmail = params.newEmail && params.newEmail !== current.email ? params.newEmail : null;
    const newPhone = params.newPhone && params.newPhone !== current.phone ? params.newPhone : null;
    if (!newEmail && !newPhone) {
      throw new CmsError(400, 'NO_CHANGE', 'Kontak baru sama dengan kontak saat ini');
    }
    const data = {
      id: randomUUID(),
      newEmail,
      newPhone,
      baseContactHash: params.computeContactHash(current),
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 86400000),
    };
    const row = await tx.contactChange.upsert({
      where: { userId: params.userId },
      create: { userId: params.userId, ...data },
      update: data,
      select: ownAccountSelect.contactChange.select,
    });
    await tx.auditLog.create({
      data: {
        actorId: params.userId,
        action: 'CONTACT_CHANGE_REQUESTED',
        resourceType: 'ContactChange',
        resourceId: row.id,
      },
    });
    return row;
  });
}

export async function deleteOwnContactChangeInTx(userId: string, sessionId: string, id: string) {
  await runOwnAccountTransaction(userId, sessionId, async (tx) => {
    const deleted = await tx.contactChange.deleteMany({ where: { id, userId } });
    if (deleted.count !== 1) {
      throw new CmsError(404, 'NOT_FOUND', 'Permintaan tidak ditemukan');
    }
    await tx.auditLog.create({
      data: {
        actorId: userId,
        action: 'CONTACT_CHANGE_CANCELLED',
        resourceType: 'ContactChange',
        resourceId: id,
      },
    });
  });
}

export async function updateOwnPasswordInTx(params: {
  userId: string;
  sessionId: string;
  expectedPasswordHash: string;
  newPasswordHash: string;
  revokeOtherSessions: boolean;
}) {
  await runOwnAccountTransaction(params.userId, params.sessionId, async (tx) => {
    const current = await tx.user.findUniqueOrThrow({ where: { id: params.userId } });
    if (current.passwordHash !== params.expectedPasswordHash) {
      throw new AccessError(409, 'CONFLICT', 'Akun berubah; masuk kembali');
    }
    await tx.user.update({
      where: { id: params.userId },
      data: { passwordHash: params.newPasswordHash },
    });
    if (params.revokeOtherSessions) {
      await tx.refreshSession.updateMany({
        where: { userId: params.userId, id: { not: params.sessionId }, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    await tx.passwordResetToken.updateMany({
      where: { userId: params.userId, usedAt: null },
      data: { usedAt: new Date() },
    });
    // A password change invalidates unverified requests, preventing stale takeover attempts.
    await tx.contactChange.deleteMany({ where: { userId: params.userId } });
    await tx.auditLog.create({
      data: {
        actorId: params.userId,
        action: params.revokeOtherSessions
          ? 'PASSWORD_CHANGED_REVOKE_OTHERS'
          : 'PASSWORD_CHANGED_KEEP_OTHERS',
        resourceType: 'User',
        resourceId: params.userId,
      },
    });
  });
}

export async function listContactChangesForAdminRepo(page: number, take: number, search: string) {
  const where = { user: { email: { contains: search, mode: 'insensitive' as const } } };
  return prisma.$transaction([
    prisma.contactChange.findMany({
      where,
      orderBy: [{ requestedAt: 'desc' }, { id: 'desc' }],
      take,
      skip: (page - 1) * take,
      select: {
        id: true,
        userId: true,
        newEmail: true,
        newPhone: true,
        requestedAt: true,
        expiresAt: true,
        user: { select: { email: true, phone: true } },
      },
    }),
    prisma.contactChange.count({ where }),
  ]);
}

export async function findContactChangeUserId(id: string) {
  return prisma.contactChange.findUnique({ where: { id }, select: { userId: true } });
}

export async function reviewContactChangeInTx(params: {
  id: string;
  actorId: string;
  sessionId: string;
  expectedActorPasswordHash: string;
  targetUserId: string;
  decision: 'APPROVE' | 'REJECT';
  computeContactHash: (user: { email: string; phone: string | null }) => string;
}) {
  try {
    await prisma.$transaction(
      async (tx) => {
        await acquireAdminAdvisoryLock(tx);
        await lockAccount(tx, params.targetUserId);
        const currentActor = await tx.user.findUnique({ where: { id: params.actorId } });
        assertRole(currentActor, ['ADMIN_KELURAHAN']);
        await assertActiveTransactionSession(tx, params.actorId, params.sessionId);
        if (currentActor!.passwordHash !== params.expectedActorPasswordHash) {
          throw new AccessError(409, 'CONFLICT', 'Akun admin berubah');
        }
        const pending = await tx.contactChange.findUnique({ where: { id: params.id } });
        if (!pending || pending.userId !== params.targetUserId) {
          throw new AccessError(409, 'CONFLICT', 'Permintaan sudah berubah; muat ulang');
        }
        if (params.decision === 'APPROVE') {
          const target = await tx.user.findUniqueOrThrow({ where: { id: params.targetUserId } });
          assertRole(target, ['MASYARAKAT']);
          if (pending.expiresAt <= new Date() || pending.baseContactHash !== params.computeContactHash(target)) {
            throw new AccessError(
              409,
              'CONTACT_REQUEST_STALE',
              'Permintaan kedaluwarsa atau kontak berubah; minta pengajuan ulang',
            );
          }
          await tx.user.update({
            where: { id: target.id },
            data: {
              ...(pending.newEmail ? { email: pending.newEmail, verifiedAt: new Date() } : {}),
              ...(pending.newPhone ? { phone: pending.newPhone } : {}),
            },
          });
          await tx.refreshSession.updateMany({
            where: { userId: target.id, revokedAt: null },
            data: { revokedAt: new Date() },
          });
          await tx.passwordResetToken.updateMany({
            where: { userId: target.id, usedAt: null },
            data: { usedAt: new Date() },
          });
        }
        await tx.contactChange.delete({ where: { id: params.id } });
        await tx.auditLog.create({
          data: {
            actorId: params.actorId,
            action: `CONTACT_CHANGE_${params.decision}`,
            resourceType: 'ContactChange',
            resourceId: params.id,
          },
        });
      },
      { isolationLevel: 'ReadCommitted' },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AccessError(
        409,
        'CONTACT_UNAVAILABLE',
        'Kontak tidak dapat digunakan; verifikasi kembali',
      );
    }
    throw error;
  }
}
