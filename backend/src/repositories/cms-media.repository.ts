import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { CmsError } from '../lib/errors.js';
import { mediaUrl } from '../validators/common.validator.js';
import type {
  mediaListQuerySchema,
  mediaPatchSchema,
} from '../validators/cms.validator.js';
import { transaction } from './common.repository.js';

export const mediaAssetSelect = {
  id: true,
  originalName: true,
  mimeType: true,
  size: true,
  alt: true,
  caption: true,
  visibility: true,
  archived: true,
  ownerId: true,
  createdAt: true,
} as const;

export async function listMediaAssetsWithCount(
  ownerId: string,
  query: ReturnType<typeof mediaListQuerySchema.parse>,
) {
  const where = {
    archived: false,
    ...(query.visibility ? { visibility: query.visibility } : {}),
    AND: [{ OR: [{ visibility: 'PUBLIC' as const }, { ownerId }] }],
    originalName: { contains: query.search, mode: 'insensitive' as const },
  };
  return prisma.$transaction([
    prisma.mediaAsset.findMany({
      where,
      select: mediaAssetSelect,
      take: query.limit,
      skip: (query.page - 1) * query.limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    }),
    prisma.mediaAsset.count({ where }),
  ]);
}

export async function createMediaAssetInTx(params: {
  id: string;
  storageKey: string;
  mimeType: string;
  size: number;
  originalName: string;
  ownerId: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  alt: string;
  caption: string;
}) {
  return transaction(async (tx) => {
    const result = await tx.mediaAsset.create({
      data: {
        id: params.id,
        storageKey: params.storageKey,
        mimeType: params.mimeType,
        size: params.size,
        originalName: params.originalName,
        ownerId: params.ownerId,
        visibility: params.visibility,
        alt: params.alt,
        caption: params.caption,
      },
      select: mediaAssetSelect,
    });
    await tx.auditLog.create({
      data: {
        actorId: params.ownerId,
        action: 'MEDIA_UPLOADED',
        resourceType: 'MediaAsset',
        resourceId: params.id,
      },
    });
    return result;
  });
}

export async function updateMediaAssetInTx(params: {
  id: string;
  input: ReturnType<typeof mediaPatchSchema.parse>;
  actorId: string;
  verifyOwnership: (ownerId: string | null | undefined) => void;
  enqueueCache: (tx: Prisma.TransactionClient) => Promise<{ id: string }>;
}) {
  return transaction(async (tx) => {
    const current = await tx.mediaAsset.findUnique({
      where: { id: params.id },
    });
    if (!current) throw new CmsError(404, 'NOT_FOUND', 'Media not found');
    if (current.visibility === 'PRIVATE')
      params.verifyOwnership(current.ownerId);
    if (current.mimeType.startsWith('image/') && !params.input.alt) {
      throw new CmsError(400, 'ALT_REQUIRED', 'Image alt text is required');
    }
    if (params.input.archived) {
      const [
        news,
        revisions,
        galleries,
        documents,
        facilities,
        potentials,
        settings,
        officials,
      ] = await Promise.all([
        tx.newsMedia.count({ where: { mediaId: params.id } }),
        tx.newsRevision.count({ where: { mediaIds: { has: params.id } } }),
        tx.galleryPhoto.count({ where: { mediaId: params.id } }),
        tx.publicDocument.count({ where: { fileId: params.id } }),
        tx.facility.count({ where: { photoId: params.id } }),
        tx.potential.count({ where: { photoId: params.id } }),
        tx.siteSetting.findUnique({ where: { id: 'site' } }),
        tx.official.count({ where: { photoUrl: mediaUrl(params.id) } }),
      ]);
      if (
        news ||
        revisions ||
        galleries ||
        documents ||
        facilities ||
        potentials ||
        officials ||
        JSON.stringify(settings?.value ?? {}).includes(mediaUrl(params.id))
      ) {
        throw new CmsError(
          409,
          'MEDIA_IN_USE',
          'Media is referenced by content or revision; keep it available',
        );
      }
    }
    const result = await tx.mediaAsset.update({
      where: { id: params.id },
      data: params.input,
      select: mediaAssetSelect,
    });
    await tx.auditLog.create({
      data: {
        actorId: params.actorId,
        action: 'MEDIA_UPDATED',
        resourceType: 'MediaAsset',
        resourceId: params.id,
      },
    });
    const event = await params.enqueueCache(tx);
    return { result, event };
  });
}

export async function findActiveMediaAssetById(id: string) {
  return prisma.mediaAsset.findFirst({ where: { id, archived: false } });
}

export async function findPublicMediaAssetById(id: string) {
  return prisma.mediaAsset.findFirst({
    where: { id, archived: false, visibility: 'PUBLIC' },
  });
}
