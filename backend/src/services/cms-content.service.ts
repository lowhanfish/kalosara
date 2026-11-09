import { CmsError } from '../lib/errors.js';
import { idSchema } from '../validators/common.validator.js';
import {
  contentInput,
  contentKindSchema,
  contentListQuerySchema,
} from '../validators/cms.validator.js';
import {
  listContentItemsWithCount,
  upsertContentItemInTx,
} from '../repositories/cms-content.repository.js';
import {
  enqueueInvalidation,
  notifyInvalidation,
} from './cache-invalidation.service.js';

export async function listContentService(
  rawKind: unknown,
  rawQuery: unknown,
  admin: boolean,
) {
  const kind = contentKindSchema.parse(rawKind);
  const query = contentListQuerySchema.parse(rawQuery);
  const [items, total] = await listContentItemsWithCount({
    kind,
    query,
    admin,
  });
  return { items, total, page: query.page, limit: query.limit };
}

export async function saveAdminContentService(
  rawKind: unknown,
  rawId: unknown,
  body: unknown,
  actorId: string,
) {
  const kind = contentKindSchema.parse(rawKind);
  const id = idSchema.parse(rawId);
  const input = contentInput.parse(body);
  if (input.kind !== kind) {
    throw new CmsError(400, 'INVALID_KIND', 'Channel does not match payload');
  }
  const result = await upsertContentItemInTx({
    id,
    kind,
    input,
    actorId,
    enqueueCache: (tx) => enqueueInvalidation(tx, ['public-content']),
  });
  return {
    item: result.item,
    cacheInvalidated: await notifyInvalidation(result.event.id),
  };
}
