import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { authenticate, requireMutation } from '../auth/routes.js';
import { loadActivePrincipal, requireRoles } from '../auth/authorization.js';
import { CmsError, idSchema, pagination, transaction } from './common.js';
import { enqueueInvalidation, notifyInvalidation } from './cache-invalidation.js';
const status = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
const aggregate = z.number().int().min(0).max(10_000_000).nullable();
export const statisticInput = z.object({
  period: z.string().regex(/^\d{4}(?:-(?:0[1-9]|1[0-2]))?$/).refine(v => Number(v.slice(0, 4)) >= 1900 && Number(v.slice(0, 4)) <= 2200),
  source: z.string().trim().min(1).max(300), referenceDate: z.iso.date(),
  population: aggregate, male: aggregate, female: aggregate, households: aggregate, rt: aggregate, rw: aggregate,
  status, expectedVersion: z.number().int().min(0),
}).strict().superRefine((v, ctx) => {
  if ([v.population, v.male, v.female, v.households, v.rt, v.rw].every(n => n === null)) ctx.addIssue({ code: 'custom', message: 'Enter at least one aggregate' });
  if (v.population !== null && v.male !== null && v.female !== null && v.male + v.female !== v.population) ctx.addIssue({ code: 'custom', message: 'Male and female totals must match population' });
});
export const placeInput = z.object({
  name: z.string().trim().min(1).max(160), description: z.string().trim().max(10000), category: z.string().trim().min(1).max(100), location: z.string().trim().min(1).max(300),
  latitude: z.number().min(-90).max(90).nullable(), longitude: z.number().min(-180).max(180).nullable(),
  photoId: idSchema.nullable(), photoAlt: z.string().trim().max(300), status, expectedVersion: z.number().int().min(0),
}).strict().superRefine((v, ctx) => {
  if ((v.latitude === null) !== (v.longitude === null)) ctx.addIssue({ code: 'custom', message: 'Coordinates must be paired' });
  if (v.photoId && !v.photoAlt) ctx.addIssue({ code: 'custom', message: 'Photo alt is required' });
});
const kindSchema = z.enum(['facilities', 'potentials']);
const statsSelect = { id: true, period: true, source: true, referenceDate: true, population: true, male: true, female: true, households: true, rt: true, rw: true, status: true, version: true, updatedAt: true } as const;
const placeSelect = { id: true, name: true, description: true, category: true, location: true, latitude: true, longitude: true, photoId: true, photoAlt: true, status: true, version: true, updatedAt: true } as const;
export const regionAdminRouter = Router();
regionAdminRouter.use(authenticate, loadActivePrincipal, requireRoles('ADMIN_KELURAHAN'));
regionAdminRouter.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
export const publicRegionRouter = Router();
function list(router: Router, admin: boolean) {
  router.get('/statistics', async (req, res) => {
    const q = pagination.extend({ status: status.optional(), period: z.string().regex(/^\d{4}(?:-(?:0[1-9]|1[0-2]))?$/).optional() }).parse(req.query);
    const where = { ...(admin ? q.status ? { status: q.status } : {} : { status: 'PUBLISHED' as const }), ...(q.period ? { period: q.period } : {}), source: { contains: q.search, mode: 'insensitive' as const } };
    const [items, total] = await prisma.$transaction([prisma.statisticSnapshot.findMany({ where, select: statsSelect, orderBy: [{ period: 'desc' }, { id: 'asc' }], take: q.limit, skip: (q.page - 1) * q.limit }), prisma.statisticSnapshot.count({ where })]);
    res.setHeader('Cache-Control', 'no-store'); res.json({ success: true, data: { items, total, page: q.page, limit: q.limit }, requestId: req.id });
  });
  router.get('/:kind', async (req, res) => {
    const kind = kindSchema.parse(req.params.kind);
    const q = pagination.extend({ status: status.optional(), category: z.string().trim().max(100).optional() }).parse(req.query);
    const where = { ...(admin ? q.status ? { status: q.status } : {} : { status: 'PUBLISHED' as const }), ...(q.category ? { category: q.category } : {}), name: { contains: q.search, mode: 'insensitive' as const }, ...(!admin ? { OR: [{ photoId: null }, { photo: { visibility: 'PUBLIC' as const, archived: false } }] } : {}) };
    const args = { where, select: placeSelect, orderBy: [{ name: 'asc' as const }, { id: 'asc' as const }], take: q.limit, skip: (q.page - 1) * q.limit };
    const [items, total] = kind === 'facilities' ? await prisma.$transaction([prisma.facility.findMany(args), prisma.facility.count({ where })]) : await prisma.$transaction([prisma.potential.findMany(args), prisma.potential.count({ where })]);
    res.setHeader('Cache-Control', 'no-store'); res.json({ success: true, data: { items, total, page: q.page, limit: q.limit }, requestId: req.id });
  });
}
list(regionAdminRouter, true); list(publicRegionRouter, false);
regionAdminRouter.put('/statistics/:id', requireMutation, async (req, res) => {
  const id = idSchema.parse(req.params.id); const { expectedVersion, referenceDate, ...data } = statisticInput.parse(req.body);
  const saved = await transaction(async tx => {
    const current = await tx.statisticSnapshot.findUnique({ where: { id } });
    if ((current?.version ?? 0) !== expectedVersion) throw new CmsError(409, 'CONFLICT', 'Reload the latest version before saving');
    const value = { ...data, referenceDate: new Date(referenceDate) };
    const item = await tx.statisticSnapshot.upsert({ where: { id }, create: { id, ...value }, update: { ...value, version: { increment: 1 } }, select: statsSelect });
    await tx.auditLog.create({ data: { actorId: req.auth!.userId, action: 'STATISTIC_SAVED', resourceType: 'StatisticSnapshot', resourceId: id } });
    return { item, event: await enqueueInvalidation(tx, ['public-content']) };
  });
  res.json({ success: true, data: { item: saved.item, cacheInvalidated: await notifyInvalidation(saved.event.id) }, requestId: req.id });
});
regionAdminRouter.put('/:kind/:id', requireMutation, async (req, res) => {
  const kind = kindSchema.parse(req.params.kind); const id = idSchema.parse(req.params.id); const { expectedVersion, ...data } = placeInput.parse(req.body);
  const saved = await transaction(async tx => {
    const current = kind === 'facilities' ? await tx.facility.findUnique({ where: { id } }) : await tx.potential.findUnique({ where: { id } });
    if ((current?.version ?? 0) !== expectedVersion) throw new CmsError(409, 'CONFLICT', 'Reload the latest version before saving');
    if (data.photoId && !await tx.mediaAsset.findFirst({ where: { id: data.photoId, visibility: 'PUBLIC', archived: false, mimeType: { startsWith: 'image/' } } })) throw new CmsError(400, 'INVALID_MEDIA', 'Choose an active PUBLIC image');
    const args = { where: { id }, create: { id, ...data }, update: { ...data, version: { increment: 1 } }, select: placeSelect };
    const item = kind === 'facilities' ? await tx.facility.upsert(args) : await tx.potential.upsert(args);
    await tx.auditLog.create({ data: { actorId: req.auth!.userId, action: 'REGION_PLACE_SAVED', resourceType: kind, resourceId: id } });
    return { item, event: await enqueueInvalidation(tx, ['public-content']) };
  });
  res.json({ success: true, data: { item: saved.item, cacheInvalidated: await notifyInvalidation(saved.event.id) }, requestId: req.id });
});
