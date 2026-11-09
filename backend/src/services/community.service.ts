import { randomUUID } from 'node:crypto';
import { CmsError } from '../lib/errors.js';
import { idSchema } from '../validators/common.validator.js';
import {
  communityRequestsQuerySchema,
  requestInput,
  requestUpdate,
  sectionInput,
  sectionSlug,
} from '../validators/community.validator.js';
import {
  createPublicRequestInTx,
  findCommunitySectionBySlug,
  findPublicRequestById,
  listCommunityRequestsWithCount,
  logPublicRequestViewed,
  saveCommunitySectionInTx,
  updatePublicRequestInTx,
} from '../repositories/community.repository.js';
import {
  enqueueInvalidation,
  notifyInvalidation,
} from './cache-invalidation.service.js';

export async function getPublishedCommunitySectionService(rawSlug: unknown) {
  const slug = sectionSlug.parse(rawSlug);
  const row = await findCommunitySectionBySlug(slug);
  const parsed = sectionInput.safeParse(row?.value);
  return {
    section:
      parsed.success && parsed.data.status === 'PUBLISHED' ? parsed.data : null,
  };
}

export async function submitCommunityRequestService(body: unknown) {
  const { consent: _consent, ...input } = requestInput.parse(body);
  const id = randomUUID();
  await createPublicRequestInTx({
    ...input,
    email: input.email || null,
    phone: input.phone || null,
    organization: input.organization || null,
    id,
  });
  return { reference: id };
}

export async function getAdminCommunitySectionService(rawSlug: unknown) {
  const slug = sectionSlug.parse(rawSlug);
  const row = await findCommunitySectionBySlug(slug);
  const parsed = sectionInput.safeParse(row?.value);
  return { section: parsed.success ? parsed.data : null };
}

export async function saveAdminCommunitySectionService(
  rawSlug: unknown,
  body: unknown,
  actorId: string,
) {
  const slug = sectionSlug.parse(rawSlug);
  const input = sectionInput.parse(body);
  const event = await saveCommunitySectionInTx({
    slug,
    input,
    actorId,
    enqueueCache: (tx) => enqueueInvalidation(tx, ['public-content']),
  });
  return {
    version: input.version + 1,
    cacheInvalidated: await notifyInvalidation(event.id),
  };
}

export async function listAdminCommunityRequestsService(query: unknown) {
  const q = communityRequestsQuerySchema.parse(query);
  const [items, total] = await listCommunityRequestsWithCount(q);
  return { items, total, page: q.page, limit: q.limit };
}

export async function getAdminCommunityRequestDetailService(
  rawId: unknown,
  actorId: string,
) {
  const id = idSchema.parse(rawId);
  const item = await findPublicRequestById(id);
  if (!item) throw new CmsError(404, 'NOT_FOUND', 'Request not found');
  await logPublicRequestViewed(actorId, item.id);
  return { item };
}

export async function updateAdminCommunityRequestService(
  rawId: unknown,
  body: unknown,
  actorId: string,
) {
  const id = idSchema.parse(rawId);
  const { expectedVersion, ...data } = requestUpdate.parse(body);
  await updatePublicRequestInTx({
    id,
    expectedVersion,
    status: data.status,
    internalNote: data.internalNote,
    actorId,
  });
  return { version: expectedVersion + 1 };
}
