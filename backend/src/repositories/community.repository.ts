import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { CmsError } from '../lib/errors.js';
import { sectionInput } from '../validators/community.validator.js';
import { transaction } from './common.repository.js';

export const communitySectionKey = (slug: string) =>
  `community.section.${slug}`;

export async function findCommunitySectionBySlug(slug: string) {
  return prisma.appSetting.findUnique({
    where: { key: communitySectionKey(slug) },
  });
}

export async function createPublicRequestInTx(params: {
  id: string;
  kind: 'COMPLAINT' | 'INFORMATION';
  name: string;
  organization: string | null;
  email: string | null;
  phone: string | null;
  subject: string;
  message: string;
}) {
  await transaction(async (tx) => {
    await tx.publicRequest.create({
      data: params,
    });
    await tx.auditLog.create({
      data: {
        action: 'PUBLIC_REQUEST_RECEIVED',
        resourceType: 'PublicRequest',
        resourceId: params.id,
      },
    });
  });
}

export async function saveCommunitySectionInTx(params: {
  slug: string;
  input: ReturnType<typeof sectionInput.parse>;
  actorId: string;
  enqueueCache: (tx: Prisma.TransactionClient) => Promise<{ id: string }>;
}) {
  const key = communitySectionKey(params.slug);
  return transaction(async (tx) => {
    const row = await tx.appSetting.findUnique({ where: { key } });
    const current = sectionInput.safeParse(row?.value);
    if ((current.success ? current.data.version : 0) !== params.input.version) {
      throw new CmsError(409, 'CONFLICT', 'Reload latest section');
    }
    await tx.appSetting.upsert({
      where: { key },
      create: { key, value: { ...params.input, version: 1 } },
      update: { value: { ...params.input, version: params.input.version + 1 } },
    });
    await tx.auditLog.create({
      data: {
        actorId: params.actorId,
        action: 'COMMUNITY_SECTION_SAVED',
        resourceType: 'AppSetting',
        resourceId: key,
      },
    });
    return params.enqueueCache(tx);
  });
}

export async function listCommunityRequestsWithCount(params: {
  kind?: 'COMPLAINT' | 'INFORMATION';
  status?: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED';
  search: string;
  page: number;
  limit: number;
}) {
  const where = {
    kind: params.kind,
    status: params.status,
    subject: { contains: params.search, mode: 'insensitive' as const },
  };
  return prisma.$transaction([
    prisma.publicRequest.findMany({
      where,
      select: {
        id: true,
        kind: true,
        subject: true,
        status: true,
        version: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: params.limit,
      skip: (params.page - 1) * params.limit,
    }),
    prisma.publicRequest.count({ where }),
  ]);
}

export async function findPublicRequestById(id: string) {
  return prisma.publicRequest.findUnique({ where: { id } });
}

export async function logPublicRequestViewed(
  actorId: string,
  resourceId: string,
) {
  await prisma.auditLog.create({
    data: {
      actorId,
      action: 'PUBLIC_REQUEST_VIEWED',
      resourceType: 'PublicRequest',
      resourceId,
    },
  });
}

export async function updatePublicRequestInTx(params: {
  id: string;
  expectedVersion: number;
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED';
  internalNote: string;
  actorId: string;
}) {
  await transaction(async (tx) => {
    const result = await tx.publicRequest.updateMany({
      where: { id: params.id, version: params.expectedVersion },
      data: {
        status: params.status,
        internalNote: params.internalNote,
        version: { increment: 1 },
      },
    });
    if (!result.count) {
      throw new CmsError(409, 'CONFLICT', 'Reload latest request');
    }
    await tx.auditLog.create({
      data: {
        actorId: params.actorId,
        action: 'PUBLIC_REQUEST_UPDATED',
        resourceType: 'PublicRequest',
        resourceId: params.id,
      },
    });
  });
}
