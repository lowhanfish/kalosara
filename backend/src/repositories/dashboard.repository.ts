import type { Role } from '@prisma/client';
import { assertRole } from '../lib/authorization.js';
import { AccessError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';
import { acquireAdminAdvisoryLock, lockAccount } from './common.repository.js';

export const dashboardUserSelect = {
  id: true,
  email: true,
  role: true,
  isActive: true,
  updatedAt: true,
  createdAt: true,
  profile: { select: { displayName: true } },
} as const;

export async function getDashboardOverviewStats() {
  return prisma.$transaction([
    prisma.news.count({ where: { status: 'PUBLISHED' } }),
    prisma.news.count({ where: { status: 'DRAFT' } }),
    prisma.contentItem.count({ where: { kind: 'announcements' } }),
    prisma.contentItem.count({ where: { kind: 'events' } }),
    prisma.mediaAsset.count(),
    prisma.user.count(),
    prisma.auditLog.findMany({
      where: { resourceType: { notIn: ['User', 'AccountProfile', 'ContactChange'] } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 10,
      select: { id: true, action: true, resourceType: true, resourceId: true, createdAt: true },
    }),
  ]);
}

export async function listDashboardUsersWithCounts(params: {
  page: number;
  limit: number;
  search: string;
  role?: 'ADMIN_KELURAHAN' | 'LURAH' | 'MASYARAKAT';
}) {
  const where = {
    email: { contains: params.search, mode: 'insensitive' as const },
    ...(params.role ? { role: params.role } : {}),
  };
  return prisma.$transaction([
    prisma.user.findMany({
      where,
      select: dashboardUserSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.user.count({ where }),
    prisma.user.count({ where: { role: 'ADMIN_KELURAHAN' } }),
    prisma.user.count({ where: { role: 'LURAH' } }),
    prisma.user.count({ where: { role: 'MASYARAKAT' } }),
  ]);
}

export async function findUserByExactEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createDashboardUserInTx(params: {
  actorId: string;
  email: string;
  passwordHash: string;
  role: Role;
  displayName?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: params.email,
        passwordHash: params.passwordHash,
        role: params.role,
        isActive: true,
        profile: params.displayName ? { create: { displayName: params.displayName } } : undefined,
      },
      select: dashboardUserSelect,
    });
    await tx.auditLog.create({
      data: {
        actorId: params.actorId,
        action: `USER_PROVISIONED_${params.role}`,
        resourceType: 'User',
        resourceId: created.id,
      },
    });
    return created;
  });
}

export async function updateUserAccessInTx(params: {
  id: string;
  actorId: string;
  expectedActorPasswordHash: string;
  expectedUpdatedAt: string;
  action: 'ACTIVATE' | 'DEACTIVATE' | 'REVOKE_SESSIONS' | 'RESET_PASSWORD' | 'SET_ROLE';
  role?: Role;
  passwordHash?: string;
}) {
  return prisma.$transaction(
    async (tx) => {
      await acquireAdminAdvisoryLock(tx);
      await lockAccount(tx, params.id);
      const currentActor = await tx.user.findUnique({ where: { id: params.actorId } });
      assertRole(currentActor, ['ADMIN_KELURAHAN']);
      if (currentActor!.passwordHash !== params.expectedActorPasswordHash) {
        throw new AccessError(409, 'CONFLICT', 'Sesi berubah; masuk kembali');
      }
      const target = await tx.user.findUnique({ where: { id: params.id } });
      if (!target || target.updatedAt.toISOString() !== params.expectedUpdatedAt) {
        throw new AccessError(409, 'CONFLICT', 'Muat ulang daftar pengguna');
      }
      if (
        target.role === 'ADMIN_KELURAHAN' &&
        target.isActive &&
        (params.action === 'DEACTIVATE' ||
          (params.action === 'SET_ROLE' && params.role !== 'ADMIN_KELURAHAN')) &&
        (await tx.user.count({ where: { role: 'ADMIN_KELURAHAN', isActive: true } })) <= 1
      ) {
        throw new AccessError(409, 'LAST_ADMIN', 'Admin aktif terakhir harus dipertahankan');
      }
      const updated = await tx.user.update({
        where: { id: params.id },
        data: {
          ...(params.action === 'ACTIVATE' ? { isActive: true } : {}),
          ...(params.action === 'DEACTIVATE' ? { isActive: false } : {}),
          ...(params.action === 'SET_ROLE' ? { role: params.role } : {}),
          ...(params.passwordHash ? { passwordHash: params.passwordHash } : {}),
          updatedAt: new Date(),
        },
        select: dashboardUserSelect,
      });
      await tx.refreshSession.updateMany({
        where: { userId: params.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.passwordResetToken.updateMany({
        where: { userId: params.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (['RESET_PASSWORD', 'DEACTIVATE', 'SET_ROLE'].includes(params.action)) {
        await tx.contactChange.deleteMany({ where: { userId: params.id } });
      }
      await tx.auditLog.create({
        data: {
          actorId: params.actorId,
          action: `USER_${params.action}${params.role ? `_${params.role}` : ''}`,
          resourceType: 'User',
          resourceId: params.id,
        },
      });
      return updated;
    },
    { isolationLevel: 'ReadCommitted' },
  );
}

export async function listAuditLogsWithCount(page: number, limit: number, search: string) {
  const where = { action: { contains: search, mode: 'insensitive' as const } };
  return prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      skip: (page - 1) * limit,
      select: {
        id: true,
        actorId: true,
        action: true,
        resourceType: true,
        resourceId: true,
        requestId: true,
        ipHash: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.count({ where }),
  ]);
}

export async function listDashboardMediaUploads(
  ownerId: string,
  page: number,
  limit: number,
  search: string,
) {
  // Private files and names remain owner-scoped, even between admins.
  const where = {
    OR: [{ visibility: 'PUBLIC' as const }, { ownerId }],
    originalName: { contains: search, mode: 'insensitive' as const },
  };
  return Promise.all([
    prisma.mediaAsset.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        originalName: true,
        size: true,
        mimeType: true,
        visibility: true,
        archived: true,
        createdAt: true,
      },
    }),
    prisma.mediaAsset.count({ where }),
  ]);
}
