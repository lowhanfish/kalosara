import { CmsError } from '../lib/errors.js';
import { idSchema } from '../validators/common.validator.js';
import {
  placeInput,
  regionKindSchema,
  regionPlacesQuerySchema,
  regionStatisticsQuerySchema,
  sanitizeBody,
  statisticInput,
} from '../validators/cms.validator.js';
import {
  findPublishedRegionPlaceById,
  listRegionPlacesWithCount,
  listRegionStatisticsWithCount,
  upsertRegionPlaceInTx,
  upsertRegionStatisticInTx,
} from '../repositories/cms-region.repository.js';
import {
  enqueueInvalidation,
  notifyInvalidation,
} from './cache-invalidation.service.js';

export async function listRegionStatisticsService(
  rawQuery: unknown,
  admin: boolean,
) {
  const q = regionStatisticsQuerySchema.parse(rawQuery);
  const [items, total] = await listRegionStatisticsWithCount(q, admin);
  return { items, total, page: q.page, limit: q.limit };
}

export async function listRegionPlacesService(
  rawKind: unknown,
  rawQuery: unknown,
  admin: boolean,
) {
  const kind = regionKindSchema.parse(rawKind);
  const q = regionPlacesQuerySchema.parse(rawQuery);
  const [items, total] = await listRegionPlacesWithCount(kind, q, admin);
  return {
    items: admin
      ? items
      : items.map((item) => ({
          ...item,
          description: sanitizeBody(item.description).html,
        })),
    total,
    page: q.page,
    limit: q.limit,
  };
}

export async function saveRegionStatisticService(
  rawId: unknown,
  body: unknown,
  actorId: string,
) {
  const id = idSchema.parse(rawId);
  const input = statisticInput.parse(body);
  const saved = await upsertRegionStatisticInTx({
    id,
    input,
    actorId,
    enqueueCache: (tx) => enqueueInvalidation(tx, ['public-content']),
  });
  return {
    item: saved.item,
    cacheInvalidated: await notifyInvalidation(saved.event.id),
  };
}

export async function saveRegionPlaceService(
  rawKind: unknown,
  rawId: unknown,
  body: unknown,
  actorId: string,
) {
  const kind = regionKindSchema.parse(rawKind);
  const id = idSchema.parse(rawId);
  const input = placeInput.parse(body);
  const saved = await upsertRegionPlaceInTx({
    kind,
    id,
    input,
    actorId,
    enqueueCache: (tx) => enqueueInvalidation(tx, ['public-content']),
  });
  return {
    item: saved.item,
    cacheInvalidated: await notifyInvalidation(saved.event.id),
  };
}

export async function getPublicRegionPlaceDetailService(
  rawKind: unknown,
  rawId: unknown,
) {
  const kind = regionKindSchema.parse(rawKind);
  const id = idSchema.parse(rawId);
  const item = await findPublishedRegionPlaceById(kind, id);
  if (!item) throw new CmsError(404, 'NOT_FOUND', 'Place not found');
  return {
    item: { ...item, description: sanitizeBody(item.description).html },
  };
}
