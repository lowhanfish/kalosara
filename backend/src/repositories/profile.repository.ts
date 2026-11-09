import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import type {
  pageSchema,
  settingSchema,
} from '../validators/profile.validator.js';
import { assertPublicImages, transaction } from './common.repository.js';

export async function findSiteSettingRow() {
  return prisma.siteSetting.findUnique({ where: { id: 'site' } });
}

export async function listPublishedPagesAndOfficials() {
  return Promise.all([
    prisma.page.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { slug: 'asc' },
    }),
    prisma.official.findMany({
      where: { status: 'PUBLISHED', active: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    }),
  ]);
}

export async function listAllPagesAndOfficials() {
  return Promise.all([
    prisma.page.findMany({ orderBy: { slug: 'asc' } }),
    prisma.official.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    }),
  ]);
}

export async function upsertSiteSettingInTx(params: {
  value: ReturnType<typeof settingSchema.parse>;
  actorId: string;
  enqueueCache: (tx: Prisma.TransactionClient) => Promise<{ id: string }>;
}) {
  return transaction(async (tx) => {
    await assertPublicImages([params.value.logoUrl, params.value.heroUrl], tx);
    await tx.siteSetting.upsert({
      where: { id: 'site' },
      create: { id: 'site', value: params.value },
      update: { value: params.value },
    });
    await tx.auditLog.create({
      data: {
        actorId: params.actorId,
        action: 'PROFILE_SETTINGS_UPDATED',
        resourceType: 'SiteSetting',
        resourceId: 'site',
      },
    });
    return params.enqueueCache(tx);
  });
}

export async function upsertProfilePageInTx(params: {
  slug: string;
  value: ReturnType<typeof pageSchema.parse>;
  actorId: string;
  enqueueCache: (tx: Prisma.TransactionClient) => Promise<{ id: string }>;
}) {
  return transaction(async (tx) => {
    const result = await tx.page.upsert({
      where: { slug: params.slug },
      create: { slug: params.slug, ...params.value },
      update: params.value,
    });
    await tx.auditLog.create({
      data: {
        actorId: params.actorId,
        action: 'PROFILE_PAGE_SAVED',
        resourceType: 'Page',
        resourceId: params.slug,
      },
    });
    return { result, event: await params.enqueueCache(tx) };
  });
}

export async function upsertOfficialInTx(params: {
  id: string;
  value: {
    name: string;
    position: string;
    unit: string;
    sortOrder: number;
    photoUrl: string | null;
    active: boolean;
    termStart: Date | null;
    termEnd: Date | null;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  };
  actorId: string;
  enqueueCache: (tx: Prisma.TransactionClient) => Promise<{ id: string }>;
}) {
  return transaction(async (tx) => {
    await assertPublicImages([params.value.photoUrl], tx);
    const result = await tx.official.upsert({
      where: { id: params.id },
      create: { id: params.id, ...params.value },
      update: params.value,
    });
    await tx.auditLog.create({
      data: {
        actorId: params.actorId,
        action: 'PROFILE_OFFICIAL_SAVED',
        resourceType: 'Official',
        resourceId: params.id,
      },
    });
    return { result, event: await params.enqueueCache(tx) };
  });
}
