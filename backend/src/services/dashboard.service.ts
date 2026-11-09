import { lstat, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { env } from '../config/env.js';
import { AccessError } from '../lib/errors.js';
import { idSchema, pagination } from '../validators/common.validator.js';
import {
  accessSchema,
  createUserSchema,
} from '../validators/dashboard.validator.js';
import { findAccountUserById } from '../repositories/account.repository.js';
import {
  createDashboardUserInTx,
  findUserByExactEmail,
  getDashboardOverviewStats,
  listAuditLogsWithCount,
  listDashboardMediaUploads,
  listDashboardUsersWithCounts,
  updateUserAccessInTx,
} from '../repositories/dashboard.repository.js';
import { hashPassword, verifyPassword } from './auth.service.js';

// Physical bytes include optimized variants and legacy files; never follow symlinks.
export async function diskBytes(directory: string): Promise<number> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 0;
    throw error;
  }
  let bytes = 0;
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) bytes += await diskBytes(path);
    else if (entry.isFile()) bytes += (await lstat(path)).size;
  }
  return bytes;
}

export async function getDashboardSummaryService() {
  const [published, draft, announcements, events, media, users, activity] =
    await getDashboardOverviewStats();
  return {
    published,
    draft,
    announcements,
    events,
    media,
    users,
    activity,
    approvalEnabled: false,
  };
}

export async function listDashboardUsersService(
  query: Record<string, unknown>,
) {
  const { page, limit, search } = pagination.parse(query);
  const roleQuery =
    typeof query.role === 'string' &&
    ['ADMIN_KELURAHAN', 'LURAH', 'MASYARAKAT'].includes(query.role)
      ? (query.role as 'ADMIN_KELURAHAN' | 'LURAH' | 'MASYARAKAT')
      : undefined;

  const [items, total, adminCount, lurahCount, masyarakatCount] =
    await listDashboardUsersWithCounts({
      page,
      limit,
      search,
      role: roleQuery,
    });

  return {
    items,
    total,
    page,
    limit,
    counts: {
      total: adminCount + lurahCount + masyarakatCount,
      admin: adminCount,
      lurah: lurahCount,
      masyarakat: masyarakatCount,
    },
  };
}

export async function createDashboardUserService(
  actorId: string,
  body: unknown,
) {
  const input = createUserSchema.parse(body);
  const actor = await findAccountUserById(actorId);
  if (!(await verifyPassword(input.currentPassword, actor.passwordHash))) {
    throw new AccessError(
      403,
      'REAUTH_REQUIRED',
      'Kata sandi admin tidak sesuai',
    );
  }
  const existing = await findUserByExactEmail(input.email);
  if (existing) {
    throw new AccessError(
      409,
      'EMAIL_EXISTS',
      'Alamat email sudah terdaftar dalam sistem',
    );
  }
  const passwordHash = await hashPassword(input.password);
  const item = await createDashboardUserInTx({
    actorId,
    email: input.email,
    passwordHash,
    role: input.role,
    displayName: input.displayName,
  });
  return { item };
}

export async function updateDashboardUserAccessService(
  actorId: string,
  rawId: unknown,
  body: unknown,
) {
  const id = idSchema.parse(rawId);
  const input = accessSchema.parse(body);
  const actor = await findAccountUserById(actorId);
  if (!(await verifyPassword(input.currentPassword, actor.passwordHash))) {
    throw new AccessError(
      403,
      'REAUTH_REQUIRED',
      'Kata sandi admin tidak sesuai',
    );
  }
  if (id === actorId) {
    throw new AccessError(
      409,
      'SELF_ACCESS_CHANGE',
      'Gunakan admin lain untuk perubahan akses akun sendiri',
    );
  }
  const passwordHash = input.newPassword
    ? await hashPassword(input.newPassword)
    : undefined;
  const item = await updateUserAccessInTx({
    id,
    actorId,
    expectedActorPasswordHash: actor.passwordHash,
    expectedUpdatedAt: input.expectedUpdatedAt,
    action: input.action,
    role: input.role,
    passwordHash,
  });
  return { item };
}

export async function listDashboardAuditLogsService(query: unknown) {
  const { page, limit, search } = pagination.parse(query);
  const [items, total] = await listAuditLogsWithCount(page, limit, search);
  return { items, total, page, limit };
}

export async function listDashboardUploadsService(
  ownerId: string,
  query: unknown,
) {
  const { page, limit, search } = pagination.parse(query);
  const [[items, total], physicalBytes] = await Promise.all([
    listDashboardMediaUploads(ownerId, page, limit, search),
    diskBytes(resolve(env.UPLOAD_ROOT)),
  ]);
  return {
    items,
    total,
    page,
    limit,
    quota: {
      perFileBytes: 20 * 1024 * 1024,
      concurrentUploads: 2,
      physicalBytes,
      totalLimitBytes: null,
    },
  };
}
