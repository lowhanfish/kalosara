import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { authenticate, requireMutation } from '../auth/routes.js';
import { loadActivePrincipal, requireRoles } from '../auth/authorization.js';
import { CmsError, idSchema, pagination, transaction } from './common.js';
import { enqueueInvalidation, notifyInvalidation } from './cache-invalidation.js';
const kindSchema = z.enum(['announcements', 'events', 'galleries', 'documents']);
const date = z.iso.datetime({ offset: true });
const common = { title: z.string().trim().min(1).max(200), content: z.string().trim().max(30000), status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']), expectedVersion: z.number().int().min(0) };
export const contentInput = z.discriminatedUnion('kind', [
  z.object({ ...common, kind: z.literal('announcements'), pinned: z.boolean(), startsAt: date.nullable(), expiredAt: date.nullable() }).strict(),
  z.object({ ...common, kind: z.literal('events'), start: date, end: date, location: z.string().trim().min(1).max(300) }).strict(),
  z.object({ ...common, kind: z.literal('galleries'), photos: z.array(z.object({ mediaId: idSchema, alt: z.string().trim().min(1).max(300) }).strict()).min(1).max(12) }).strict(),
  z.object({ ...common, kind: z.literal('documents'), category: z.string().trim().min(1).max(120), fileId: idSchema }).strict(),
]).superRefine((input, ctx) => {
  if (input.kind === 'events' && new Date(input.end) < new Date(input.start)) ctx.addIssue({ code: 'custom', message: 'End must follow start' });
  if (input.kind === 'announcements' && input.startsAt && input.expiredAt && new Date(input.expiredAt) <= new Date(input.startsAt)) ctx.addIssue({ code: 'custom', message: 'Expiry must follow start' });
  if (input.kind === 'galleries' && new Set(input.photos.map(p => p.mediaId)).size !== input.photos.length) ctx.addIssue({ code: 'custom', message: 'Duplicate photo' });
});
const include = { announcement: true, event: true, gallery: { include: { photos: { orderBy: { sortOrder: 'asc' as const } } } }, document: true };
export const contentAdminRouter = Router();
contentAdminRouter.use(authenticate, loadActivePrincipal, requireRoles('ADMIN_KELURAHAN'));
contentAdminRouter.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
export const publicContentRouter = Router();
function listRouter(router: Router, admin: boolean) {
  router.get('/:kind', async (req, res) => {
    const kind = kindSchema.parse(req.params.kind);
    const q = pagination.extend({ status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(), period: z.enum(['upcoming', 'past']).optional(), category: z.string().trim().max(120).optional() }).parse(req.query);
    const now = new Date();
    const where: Prisma.ContentItemWhereInput = { kind, title: { contains: q.search, mode: 'insensitive' }, ...(admin ? (q.status ? { status: q.status } : {}) : { status: 'PUBLISHED' }) };
    if (kind === 'announcements' && !admin) where.announcement = { AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ expiredAt: null }, { expiredAt: { gt: now } }] }] };
    if (kind === 'events' && q.period) where.event = { end: q.period === 'past' ? { lt: now } : { gte: now } };
    if (kind === 'documents') where.document = { ...(q.category ? { category: q.category } : {}), ...(!admin ? { file: { visibility: 'PUBLIC', archived: false } } : {}) };
    if (kind === 'galleries' && !admin) where.gallery = { photos: { every: { media: { visibility: 'PUBLIC', archived: false } } } };
    const orderBy: Prisma.ContentItemOrderByWithRelationInput[] = kind === 'announcements' ? [{ announcement: { pinned: 'desc' } }, { updatedAt: 'desc' }, { id: 'asc' }] : kind === 'events' ? [{ event: { start: q.period === 'past' ? 'desc' : 'asc' } }, { id: 'asc' }] : [{ updatedAt: 'desc' }, { id: 'asc' }];
    const [items, total] = await prisma.$transaction([prisma.contentItem.findMany({ where, include, orderBy, skip: (q.page - 1) * q.limit, take: q.limit }), prisma.contentItem.count({ where })]);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data: { items, total, page: q.page, limit: q.limit }, requestId: req.id });
  });
}
listRouter(contentAdminRouter, true);
listRouter(publicContentRouter, false);
contentAdminRouter.put('/:kind/:id', requireMutation, async (req, res) => {
  const kind = kindSchema.parse(req.params.kind); const id = idSchema.parse(req.params.id);
  const input = contentInput.parse(req.body);
  if (input.kind !== kind) throw new CmsError(400, 'INVALID_KIND', 'Channel does not match payload');
  const result = await transaction(async tx => {
    const current = await tx.contentItem.findUnique({ where: { id } });
    if (current && current.kind !== kind) throw new CmsError(409, 'CONFLICT', 'Channel cannot change');
    if ((current?.version ?? 0) !== input.expectedVersion) throw new CmsError(409, 'CONFLICT', 'Reload the latest version before saving');
    if (input.kind === 'galleries' || input.kind === 'documents') {
      const ids = input.kind === 'galleries' ? input.photos.map(p => p.mediaId) : [input.fileId];
      const files = await tx.mediaAsset.findMany({ where: { id: { in: ids }, archived: false } });
      if (files.length !== ids.length || files.some(file => input.kind === 'galleries' ? file.visibility !== 'PUBLIC' || !file.mimeType.startsWith('image/') : file.mimeType !== 'application/pdf' || (file.visibility === 'PRIVATE' && file.ownerId !== req.auth!.userId) || (input.status === 'PUBLISHED' && file.visibility !== 'PUBLIC'))) throw new CmsError(400, 'INVALID_MEDIA', 'Use active public images or an authorized PDF; published PDFs must be PUBLIC');
    }
    const data = { title: input.title, content: input.content, status: input.status };
    await tx.contentItem.upsert({ where: { id }, create: { id, kind, ...data }, update: { ...data, version: { increment: 1 } } });
    if (input.kind === 'announcements') {
      const data = { pinned: input.pinned, startsAt: input.startsAt, expiredAt: input.expiredAt };
      await tx.announcement.upsert({ where: { contentId: id }, create: { contentId: id, ...data }, update: data });
    } else if (input.kind === 'events') {
      const data = { start: input.start, end: input.end, location: input.location };
      await tx.event.upsert({ where: { contentId: id }, create: { contentId: id, ...data }, update: data });
    } else if (input.kind === 'documents') {
      const data = { category: input.category, fileId: input.fileId };
      await tx.publicDocument.upsert({ where: { contentId: id }, create: { contentId: id, ...data }, update: data });
    } else {
      await tx.gallery.upsert({ where: { contentId: id }, create: { contentId: id }, update: {} });
      await tx.galleryPhoto.deleteMany({ where: { galleryId: id } });
      await tx.galleryPhoto.createMany({ data: input.photos.map((photo, sortOrder) => ({ ...photo, galleryId: id, sortOrder })) });
    }
    await tx.auditLog.create({ data: { actorId: req.auth!.userId, action: 'CONTENT_SAVED', resourceType: kind, resourceId: id } });
    return { item: await tx.contentItem.findUniqueOrThrow({ where: { id }, include }), event: await enqueueInvalidation(tx, ['public-content']) };
  });
  res.json({ success: true, data: { item: result.item, cacheInvalidated: await notifyInvalidation(result.event.id) }, requestId: req.id });
});
