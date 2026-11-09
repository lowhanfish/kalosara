import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { CmsError } from '../lib/errors.js';
import type {
  contentInput,
  contentKindSchema,
  contentListQuerySchema,
} from '../validators/cms.validator.js';
import { transaction } from './common.repository.js';

export const contentRelationsInclude = {
  announcement: true,
  event: true,
  gallery: { include: { photos: { orderBy: { sortOrder: 'asc' as const } } } },
  document: true,
};

export async function listContentItemsWithCount(params: {
  kind: ReturnType<typeof contentKindSchema.parse>;
  query: ReturnType<typeof contentListQuerySchema.parse>;
  admin: boolean;
}) {
  const { kind, query: q, admin } = params;
  const now = new Date();
  const where: Prisma.ContentItemWhereInput = {
    kind,
    title: { contains: q.search, mode: 'insensitive' },
    ...(admin
      ? q.status
        ? { status: q.status }
        : {}
      : { status: 'PUBLISHED' }),
  };

  if (kind === 'announcements' && !admin) {
    where.announcement = {
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ expiredAt: null }, { expiredAt: { gt: now } }] },
      ],
    };
  }
  if (kind === 'events' && q.period) {
    where.event = { end: q.period === 'past' ? { lt: now } : { gte: now } };
  }
  if (kind === 'documents') {
    where.document = {
      ...(q.classification ? { classification: q.classification } : {}),
      ...(q.category ? { category: q.category } : {}),
      ...(!admin ? { file: { visibility: 'PUBLIC', archived: false } } : {}),
    };
  }
  if (kind === 'galleries' && !admin) {
    where.gallery = {
      photos: { every: { media: { visibility: 'PUBLIC', archived: false } } },
    };
  }

  const orderBy: Prisma.ContentItemOrderByWithRelationInput[] =
    kind === 'announcements'
      ? [
          { announcement: { pinned: 'desc' } },
          { updatedAt: 'desc' },
          { id: 'asc' },
        ]
      : kind === 'events'
        ? [
            { event: { start: q.period === 'past' ? 'desc' : 'asc' } },
            { id: 'asc' },
          ]
        : [{ updatedAt: 'desc' }, { id: 'asc' }];

  return prisma.$transaction([
    prisma.contentItem.findMany({
      where,
      include: contentRelationsInclude,
      orderBy,
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    prisma.contentItem.count({ where }),
  ]);
}

export async function upsertContentItemInTx(params: {
  id: string;
  kind: ReturnType<typeof contentKindSchema.parse>;
  input: ReturnType<typeof contentInput.parse>;
  actorId: string;
  enqueueCache: (tx: Prisma.TransactionClient) => Promise<{ id: string }>;
}) {
  const { id, kind, input, actorId, enqueueCache } = params;
  return transaction(async (tx) => {
    const current = await tx.contentItem.findUnique({ where: { id } });
    if (current && current.kind !== kind) {
      throw new CmsError(409, 'CONFLICT', 'Channel cannot change');
    }
    if ((current?.version ?? 0) !== input.expectedVersion) {
      throw new CmsError(
        409,
        'CONFLICT',
        'Reload the latest version before saving',
      );
    }
    if (input.kind === 'galleries' || input.kind === 'documents') {
      const ids =
        input.kind === 'galleries'
          ? input.photos.map((p) => p.mediaId)
          : [input.fileId];
      const files = await tx.mediaAsset.findMany({
        where: { id: { in: ids }, archived: false },
      });
      if (
        files.length !== ids.length ||
        files.some((file) =>
          input.kind === 'galleries'
            ? file.visibility !== 'PUBLIC' ||
              !file.mimeType.startsWith('image/')
            : file.mimeType !== 'application/pdf' ||
              (file.visibility === 'PRIVATE' && file.ownerId !== actorId) ||
              (input.status === 'PUBLISHED' && file.visibility !== 'PUBLIC'),
        )
      ) {
        throw new CmsError(
          400,
          'INVALID_MEDIA',
          'Use active public images or an authorized PDF; published PDFs must be PUBLIC',
        );
      }
    }
    const data = {
      title: input.title,
      content: input.content,
      status: input.status,
    };
    await tx.contentItem.upsert({
      where: { id },
      create: { id, kind, ...data },
      update: { ...data, version: { increment: 1 } },
    });
    if (input.kind === 'announcements') {
      const announcementData = {
        pinned: input.pinned,
        startsAt: input.startsAt,
        expiredAt: input.expiredAt,
      };
      await tx.announcement.upsert({
        where: { contentId: id },
        create: { contentId: id, ...announcementData },
        update: announcementData,
      });
    } else if (input.kind === 'events') {
      const eventData = {
        start: input.start,
        end: input.end,
        location: input.location,
      };
      await tx.event.upsert({
        where: { contentId: id },
        create: { contentId: id, ...eventData },
        update: eventData,
      });
    } else if (input.kind === 'documents') {
      const docData = {
        category: input.category,
        classification: input.classification ?? null,
        fileId: input.fileId,
      };
      await tx.publicDocument.upsert({
        where: { contentId: id },
        create: { contentId: id, ...docData },
        update: docData,
      });
    } else {
      await tx.gallery.upsert({
        where: { contentId: id },
        create: { contentId: id },
        update: {},
      });
      await tx.galleryPhoto.deleteMany({ where: { galleryId: id } });
      await tx.galleryPhoto.createMany({
        data: input.photos.map((photo, sortOrder) => ({
          ...photo,
          galleryId: id,
          sortOrder,
        })),
      });
    }
    await tx.auditLog.create({
      data: {
        actorId,
        action: 'CONTENT_SAVED',
        resourceType: kind,
        resourceId: id,
      },
    });
    return {
      item: await tx.contentItem.findUniqueOrThrow({
        where: { id },
        include: contentRelationsInclude,
      }),
      event: await enqueueCache(tx),
    };
  });
}
