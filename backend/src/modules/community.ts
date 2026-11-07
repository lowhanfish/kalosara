import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireMutation } from './auth/routes.js';
import { loadActivePrincipal, requireRoles } from './auth/authorization.js';
import { CmsError, idSchema, pagination, transaction } from './cms/common.js';
import { enqueueInvalidation, notifyInvalidation } from './cms/cache-invalidation.js';

export const sectionSlug = z.enum(['anggaran', 'bansos', 'stunting']);
export const sectionInput = z.object({
  title: z.string().trim().min(1).max(160), content: z.string().trim().max(15000),
  period: z.string().trim().max(80), source: z.string().trim().max(300),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']), version: z.number().int().min(0),
  metrics: z.array(z.object({ label: z.string().trim().min(1).max(100), value: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).nullable(), unit: z.enum(['Rp', 'orang', 'keluarga', 'program', 'kasus']) }).strict()).max(12),
}).strict().superRefine((v, ctx) => {
  if (v.status === 'PUBLISHED' && (!v.period || !v.source || (!v.content && !v.metrics.some(m => m.value !== null)))) ctx.addIssue({ code: 'custom', message: 'Publication requires period, source and content or metrics' });
});
export const requestInput = z.object({
  kind: z.enum(['COMPLAINT', 'INFORMATION']), name: z.string().trim().min(2).max(120),
  organization: z.string().trim().max(200).optional(), email: z.union([z.email().max(254), z.literal('')]).optional(),
  phone: z.union([z.string().regex(/^\+?[\d ()-]{6,30}$/), z.literal('')]).optional(),
  subject: z.string().trim().min(5).max(200), message: z.string().trim().min(20).max(5000), consent: z.literal(true),
}).strict().refine(v => !!v.email || !!v.phone, 'Provide a contact for follow-up');
export const requestUpdate = z.object({ status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED']), internalNote: z.string().trim().max(5000), expectedVersion: z.number().int().min(1) }).strict();
const kind = z.enum(['COMPLAINT', 'INFORMATION']);
const requestStatus = requestUpdate.shape.status;
const key = (slug: string) => `community.section.${slug}`;
export const publicCommunityRouter = Router();
publicCommunityRouter.get('/sections/:slug', async (req, res) => {
  const slug = sectionSlug.parse(req.params.slug);
  const row = await prisma.appSetting.findUnique({ where: { key: key(slug) } });
  const parsed = sectionInput.safeParse(row?.value);
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, data: { section: parsed.success && parsed.data.status === 'PUBLISHED' ? parsed.data : null }, requestId: req.id });
});
const intakeLimit = rateLimit({ windowMs: 15 * 60_000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false, handler: (req, res) => res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Please try again later' }, requestId: req.id }) });
publicCommunityRouter.use('/requests', (_req, res, next) => { res.setHeader('Cache-Control', 'private, no-store'); next(); });
publicCommunityRouter.post('/requests', intakeLimit, requireMutation, async (req, res) => {
  const { consent, ...input } = requestInput.parse(req.body); void consent;
  const id = randomUUID();
  await transaction(async tx => {
    await tx.publicRequest.create({ data: { ...input, email: input.email || null, phone: input.phone || null, organization: input.organization || null, id } });
    await tx.auditLog.create({ data: { action: 'PUBLIC_REQUEST_RECEIVED', resourceType: 'PublicRequest', resourceId: id } });
  });
  res.status(201).json({ success: true, data: { reference: id }, requestId: req.id });
});
export const adminCommunityRouter = Router();
adminCommunityRouter.use(authenticate, loadActivePrincipal, requireRoles('ADMIN_KELURAHAN'));
adminCommunityRouter.use((_req, res, next) => { res.setHeader('Cache-Control', 'private, no-store'); next(); });
adminCommunityRouter.get('/sections/:slug', async (req, res) => {
  const row = await prisma.appSetting.findUnique({ where: { key: key(sectionSlug.parse(req.params.slug)) } });
  const parsed = sectionInput.safeParse(row?.value);
  res.json({ success: true, data: { section: parsed.success ? parsed.data : null }, requestId: req.id });
});
adminCommunityRouter.put('/sections/:slug', requireMutation, async (req, res) => {
  const slug = sectionSlug.parse(req.params.slug); const input = sectionInput.parse(req.body);
  const event = await transaction(async tx => {
    const row = await tx.appSetting.findUnique({ where: { key: key(slug) } }); const current = sectionInput.safeParse(row?.value);
    if ((current.success ? current.data.version : 0) !== input.version) throw new CmsError(409, 'CONFLICT', 'Reload latest section');
    await tx.appSetting.upsert({ where: { key: key(slug) }, create: { key: key(slug), value: { ...input, version: 1 } }, update: { value: { ...input, version: input.version + 1 } } });
    await tx.auditLog.create({ data: { actorId: req.auth!.userId, action: 'COMMUNITY_SECTION_SAVED', resourceType: 'AppSetting', resourceId: key(slug) } });
    return enqueueInvalidation(tx, ['public-content']);
  });
  res.json({ success: true, data: { version: input.version + 1, cacheInvalidated: await notifyInvalidation(event.id) }, requestId: req.id });
});
adminCommunityRouter.get('/requests', async (req, res) => {
  const q = pagination.extend({ kind: kind.optional(), status: requestStatus.optional() }).parse(req.query);
  const where = { kind: q.kind, status: q.status, subject: { contains: q.search, mode: 'insensitive' as const } };
  const [items, total] = await prisma.$transaction([prisma.publicRequest.findMany({ where, select: { id: true, kind: true, subject: true, status: true, version: true, createdAt: true }, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], take: q.limit, skip: (q.page - 1) * q.limit }), prisma.publicRequest.count({ where })]);
  res.json({ success: true, data: { items, total, page: q.page, limit: q.limit }, requestId: req.id });
});
adminCommunityRouter.get('/requests/:id', async (req, res) => {
  const item = await prisma.publicRequest.findUnique({ where: { id: idSchema.parse(req.params.id) } });
  if (!item) throw new CmsError(404, 'NOT_FOUND', 'Request not found');
  await prisma.auditLog.create({ data: { actorId: req.auth!.userId, action: 'PUBLIC_REQUEST_VIEWED', resourceType: 'PublicRequest', resourceId: item.id } });
  res.json({ success: true, data: { item }, requestId: req.id });
});
adminCommunityRouter.patch('/requests/:id', requireMutation, async (req, res) => {
  const id = idSchema.parse(req.params.id); const { expectedVersion, ...data } = requestUpdate.parse(req.body);
  await transaction(async tx => {
    const result = await tx.publicRequest.updateMany({ where: { id, version: expectedVersion }, data: { ...data, version: { increment: 1 } } });
    if (!result.count) throw new CmsError(409, 'CONFLICT', 'Reload latest request');
    await tx.auditLog.create({ data: { actorId: req.auth!.userId, action: 'PUBLIC_REQUEST_UPDATED', resourceType: 'PublicRequest', resourceId: id } });
  });
  res.json({ success: true, data: { version: expectedVersion + 1 }, requestId: req.id });
});
