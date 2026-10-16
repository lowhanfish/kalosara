import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { authenticate, requireMutation } from '../auth/routes.js';
import { loadActivePrincipal, requireRoles } from '../auth/authorization.js';
import { CmsError, idSchema, pagination, transaction, assertPublicImages, mediaUrl } from './common.js';
import { newsInput, sanitizeBody } from './sanitize.js';

export const newsAdminRouter = Router();
newsAdminRouter.use(authenticate, loadActivePrincipal, requireRoles('ADMIN_KELURAHAN'));
newsAdminRouter.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
const categoryInput = z.object({ name: z.string().trim().min(1).max(120), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100), archived: z.boolean() }).strict();
newsAdminRouter.get('/categories', async (req, res) => {
  const query = pagination.parse(req.query);
  const where = { name: { contains: query.search, mode: 'insensitive' as const } };
  const [items, total] = await prisma.$transaction([prisma.newsCategory.findMany({ where, take: query.limit, skip: (query.page - 1) * query.limit, orderBy: [{ name: 'asc' }, { id: 'asc' }] }), prisma.newsCategory.count({ where })]);
  res.json({ success: true, data: { items, total, page: query.page, limit: query.limit }, requestId: req.id });
});
newsAdminRouter.put('/categories/:id', requireMutation, async (req, res) => {
  const id = idSchema.parse(req.params.id); const input = categoryInput.parse(req.body);
  const category = await transaction(async tx => {
    const current = await tx.newsCategory.findUnique({ where: { id } });
    if (current && current.slug !== input.slug) throw new CmsError(400, 'SLUG_IMMUTABLE', 'Category slug cannot change');
    if (input.archived && await tx.news.count({ where: { categoryId: id, status: { not: 'ARCHIVED' } } })) throw new CmsError(409, 'CATEGORY_IN_USE', 'Archive its news before archiving this category');
    const result = await tx.newsCategory.upsert({ where: { id }, create: { id, ...input }, update: input });
    await tx.auditLog.create({ data: { actorId: req.auth!.userId, action: 'NEWS_CATEGORY_SAVED', resourceType: 'NewsCategory', resourceId: id } });
    return result;
  });
  res.json({ success: true, data: { category }, requestId: req.id });
});
newsAdminRouter.get('/', async (req, res) => {
  const query = pagination.extend({ status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(), categoryId: z.uuid().optional(), sort: z.enum(['newest', 'oldest', 'title']).default('newest') }).parse(req.query);
  const where: Prisma.NewsWhereInput = { status: query.status, categoryId: query.categoryId, OR: [{ title: { contains: query.search, mode: 'insensitive' } }, { slug: { contains: query.search, mode: 'insensitive' } }] };
  const orderBy: Prisma.NewsOrderByWithRelationInput[] = query.sort === 'title' ? [{ title: 'asc' }, { id: 'asc' }] : [{ updatedAt: query.sort === 'oldest' ? 'asc' : 'desc' }, { id: 'asc' }];
  const [items, total] = await prisma.$transaction([prisma.news.findMany({ where, select: { id: true, title: true, slug: true, status: true, version: true, updatedAt: true, category: { select: { name: true } } }, skip: (query.page - 1) * query.limit, take: query.limit, orderBy }), prisma.news.count({ where })]);
  res.json({ success: true, data: { items, total, page: query.page, limit: query.limit }, requestId: req.id });
});
newsAdminRouter.get('/:id', async (req, res) => {
  const news = await prisma.news.findUnique({ where: { id: idSchema.parse(req.params.id) } });
  if (!news) throw new CmsError(404, 'NOT_FOUND', 'News not found');
  res.json({ success: true, data: { news }, requestId: req.id });
});
newsAdminRouter.get('/:id/revisions', async (req, res) => {
  const newsId = idSchema.parse(req.params.id); const query = pagination.parse(req.query);
  const [items, total] = await prisma.$transaction([prisma.newsRevision.findMany({ where: { newsId }, select: { id: true, version: true, createdAt: true }, take: query.limit, skip: (query.page - 1) * query.limit, orderBy: { version: 'desc' } }), prisma.newsRevision.count({ where: { newsId } })]);
  res.json({ success: true, data: { items, total, page: query.page, limit: query.limit }, requestId: req.id });
});
async function saveNews(tx: Prisma.TransactionClient, id: string, raw: unknown, actorId: string) {
  const input = newsInput.parse(raw);
  const current = await tx.news.findUnique({ where: { id } });
  if ((current?.version ?? 0) !== input.expectedVersion) throw new CmsError(409, 'VERSION_CONFLICT', 'News changed; reload before saving');
  if (current && current.slug !== input.slug) throw new CmsError(400, 'SLUG_IMMUTABLE', 'News slug cannot change');
  const category = await tx.newsCategory.findUnique({ where: { id: input.categoryId } });
  if (!category || category.archived) throw new CmsError(400, 'INVALID_CATEGORY', 'Choose an active category');
  const body = sanitizeBody(input.bodyHtml);
  const mediaIds = [...new Set([...body.mediaIds, ...(input.coverId ? [input.coverId] : [])])];
  await assertPublicImages(mediaIds.map(mediaUrl), tx);
  if (input.status === 'PUBLISHED' && (!input.excerpt || !body.html.replace(/<[^>]*>/g, '').trim())) throw new CmsError(400, 'INCOMPLETE_NEWS', 'Published news requires an excerpt and body text');
  const version = (current?.version ?? 0) + 1;
  const { expectedVersion: _version, ...fields } = input; void _version;
  const data = { ...fields, bodyHtml: body.html, version, publishedAt: input.status === 'PUBLISHED' ? current?.publishedAt ?? new Date() : current?.publishedAt ?? null };
  const news = await tx.news.upsert({ where: { id }, create: { id, authorId: actorId, ...data }, update: data });
  await tx.newsMedia.deleteMany({ where: { newsId: id } });
  if (mediaIds.length) await tx.newsMedia.createMany({ data: mediaIds.map(mediaId => ({ newsId: id, mediaId })) });
  await tx.newsRevision.create({ data: { newsId: id, version, editorId: actorId, mediaIds, snapshot: { ...fields, bodyHtml: body.html } } });
  await tx.auditLog.create({ data: { actorId, action: 'NEWS_SAVED', resourceType: 'News', resourceId: id } });
  return news;
}
newsAdminRouter.put('/:id', requireMutation, async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const news = await transaction(tx => saveNews(tx, id, req.body, req.auth!.userId));
  res.json({ success: true, data: { news }, requestId: req.id });
});
newsAdminRouter.post('/:id/rollback', requireMutation, async (req, res) => {
  const newsId = idSchema.parse(req.params.id);
  const input = z.object({ revisionId: z.uuid(), expectedVersion: z.number().int().min(1) }).strict().parse(req.body);
  const news = await transaction(async tx => {
    const revision = await tx.newsRevision.findFirst({ where: { id: input.revisionId, newsId } });
    if (!revision) throw new CmsError(404, 'NOT_FOUND', 'Revision not found for this news');
    const snapshot = revision.snapshot as Prisma.JsonObject;
    const result = await saveNews(tx, newsId, { ...snapshot, status: 'DRAFT', expectedVersion: input.expectedVersion }, req.auth!.userId);
    await tx.auditLog.create({ data: { actorId: req.auth!.userId, action: 'NEWS_ROLLED_BACK', resourceType: 'News', resourceId: newsId } });
    return result;
  });
  res.json({ success: true, data: { news }, requestId: req.id });
});
// Authenticated preview uses only server-sanitized saved content. Never a public preview token/URL.
newsAdminRouter.get('/:id/preview', async (req, res) => {
  const news = await prisma.news.findUnique({ where: { id: idSchema.parse(req.params.id) }, select: { title: true, excerpt: true, bodyHtml: true, status: true, cover: { select: { id: true, alt: true, caption: true } } } });
  if (!news) throw new CmsError(404, 'NOT_FOUND', 'News not found');
  res.json({ success: true, data: { news: { ...news, bodyHtml: sanitizeBody(news.bodyHtml).html } }, requestId: req.id });
});
// The public rendering/SEO routes remain Prompt 08. This read contract exposes only published data.
export const publicNewsRouter = Router();
publicNewsRouter.get('/:slug', async (req, res) => {
  const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180).parse(req.params.slug);
  const news = await prisma.news.findFirst({ where: { slug, status: 'PUBLISHED' }, select: { slug: true, title: true, excerpt: true, bodyHtml: true, publishedAt: true, category: { select: { name: true, slug: true } }, cover: { select: { id: true, alt: true, caption: true } } } });
  if (!news) throw new CmsError(404, 'NOT_FOUND', 'News not found');
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, data: { news: { ...news, bodyHtml: sanitizeBody(news.bodyHtml).html } }, requestId: req.id });
});
