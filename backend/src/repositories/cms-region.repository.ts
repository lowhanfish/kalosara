import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { CmsError } from '../lib/errors.js';
import type {
  placeInput,
  regionKindSchema,
  regionPlacesQuerySchema,
  regionStatisticsQuerySchema,
  statisticInput,
} from '../validators/cms.validator.js';
import { transaction } from './common.repository.js';

export const regionStatsSelect = {
  id: true,
  period: true,
  source: true,
  referenceDate: true,
  population: true,
  male: true,
  female: true,
  households: true,
  rt: true,
  rw: true,
  status: true,
  version: true,
  updatedAt: true,
} as const;

export const regionPlaceSelect = {
  id: true,
  name: true,
  description: true,
  category: true,
  location: true,
  latitude: true,
  longitude: true,
  photoId: true,
  photoAlt: true,
  status: true,
  version: true,
  updatedAt: true,
} as const;

export async function listRegionStatisticsWithCount(
  q: ReturnType<typeof regionStatisticsQuerySchema.parse>,
  admin: boolean,
) {
  const where = {
    ...(admin
      ? q.status
        ? { status: q.status }
        : {}
      : { status: 'PUBLISHED' as const }),
    ...(q.period ? { period: q.period } : {}),
    source: { contains: q.search, mode: 'insensitive' as const },
  };
  return prisma.$transaction([
    prisma.statisticSnapshot.findMany({
      where,
      select: regionStatsSelect,
      orderBy: [{ period: 'desc' }, { id: 'asc' }],
      take: q.limit,
      skip: (q.page - 1) * q.limit,
    }),
    prisma.statisticSnapshot.count({ where }),
  ]);
}

export async function listRegionPlacesWithCount(
  kind: ReturnType<typeof regionKindSchema.parse>,
  q: ReturnType<typeof regionPlacesQuerySchema.parse>,
  admin: boolean,
) {
  const where = {
    ...(admin
      ? q.status
        ? { status: q.status }
        : {}
      : { status: 'PUBLISHED' as const }),
    ...(q.category ? { category: q.category } : {}),
    name: { contains: q.search, mode: 'insensitive' as const },
    ...(!admin
      ? {
          OR: [
            { photoId: null },
            { photo: { visibility: 'PUBLIC' as const, archived: false } },
          ],
        }
      : {}),
  };
  const args = {
    where,
    select: regionPlaceSelect,
    orderBy: [{ name: 'asc' as const }, { id: 'asc' as const }],
    take: q.limit,
    skip: (q.page - 1) * q.limit,
  };
  return kind === 'facilities'
    ? prisma.$transaction([
        prisma.facility.findMany(args),
        prisma.facility.count({ where }),
      ])
    : prisma.$transaction([
        prisma.potential.findMany(args),
        prisma.potential.count({ where }),
      ]);
}

export async function upsertRegionStatisticInTx(params: {
  id: string;
  input: ReturnType<typeof statisticInput.parse>;
  actorId: string;
  enqueueCache: (tx: Prisma.TransactionClient) => Promise<{ id: string }>;
}) {
  const { expectedVersion, referenceDate, ...data } = params.input;
  return transaction(async (tx) => {
    const current = await tx.statisticSnapshot.findUnique({
      where: { id: params.id },
    });
    if ((current?.version ?? 0) !== expectedVersion) {
      throw new CmsError(
        409,
        'CONFLICT',
        'Reload the latest version before saving',
      );
    }
    const value = { ...data, referenceDate: new Date(referenceDate) };
    const item = await tx.statisticSnapshot.upsert({
      where: { id: params.id },
      create: { id: params.id, ...value },
      update: { ...value, version: { increment: 1 } },
      select: regionStatsSelect,
    });
    await tx.auditLog.create({
      data: {
        actorId: params.actorId,
        action: 'STATISTIC_SAVED',
        resourceType: 'StatisticSnapshot',
        resourceId: params.id,
      },
    });
    return { item, event: await params.enqueueCache(tx) };
  });
}

export async function upsertRegionPlaceInTx(params: {
  kind: ReturnType<typeof regionKindSchema.parse>;
  id: string;
  input: ReturnType<typeof placeInput.parse>;
  actorId: string;
  enqueueCache: (tx: Prisma.TransactionClient) => Promise<{ id: string }>;
}) {
  const { expectedVersion, ...data } = params.input;
  return transaction(async (tx) => {
    const current =
      params.kind === 'facilities'
        ? await tx.facility.findUnique({ where: { id: params.id } })
        : await tx.potential.findUnique({ where: { id: params.id } });
    if ((current?.version ?? 0) !== expectedVersion) {
      throw new CmsError(
        409,
        'CONFLICT',
        'Reload the latest version before saving',
      );
    }
    if (
      data.photoId &&
      !(await tx.mediaAsset.findFirst({
        where: {
          id: data.photoId,
          visibility: 'PUBLIC',
          archived: false,
          mimeType: { startsWith: 'image/' },
        },
      }))
    ) {
      throw new CmsError(400, 'INVALID_MEDIA', 'Choose an active PUBLIC image');
    }
    const args = {
      where: { id: params.id },
      create: { id: params.id, ...data },
      update: { ...data, version: { increment: 1 } },
      select: regionPlaceSelect,
    };
    const item =
      params.kind === 'facilities'
        ? await tx.facility.upsert(args)
        : await tx.potential.upsert(args);
    await tx.auditLog.create({
      data: {
        actorId: params.actorId,
        action: 'REGION_PLACE_SAVED',
        resourceType: params.kind,
        resourceId: params.id,
      },
    });
    return { item, event: await params.enqueueCache(tx) };
  });
}

export async function findPublishedRegionPlaceById(
  kind: ReturnType<typeof regionKindSchema.parse>,
  id: string,
) {
  const where = {
    id,
    status: 'PUBLISHED' as const,
    OR: [
      { photoId: null },
      { photo: { visibility: 'PUBLIC' as const, archived: false } },
    ],
  };
  return kind === 'facilities'
    ? prisma.facility.findFirst({ where, select: regionPlaceSelect })
    : prisma.potential.findFirst({ where, select: regionPlaceSelect });
}
