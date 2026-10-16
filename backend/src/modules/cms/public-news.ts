import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { CmsError, pagination } from './common.js';
import { sanitizeBody } from './sanitize.js';
export const publicNewsRouter = Router();
const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180);
const summary = { slug: true, title: true, excerpt: true, publishedAt: true, updatedAt: true, category: { select: { name: true, slug: true } }, cover: { select: { id: true, alt: true, caption: true } } } as const;
publicNewsRouter.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
publicNewsRouter.get('/', async (req, res) => {
  const query = pagination.extend({ category: slugSchema.optional() }).parse(req.query);
  let category: { name: string; slug: string } | null = null;
  if (query.category) {
    category = await prisma.newsCategory.findFirst({ where: { slug: query.category, archived: false, news: { some: { status: 'PUBLISHED' } } }, select: { name: true, slug: true } });
    if (!category) throw new CmsError(404, 'NOT_FOUND', 'Category not found');
  }
  const where: Prisma.NewsWhereInput = { status: 'PUBLISHED', ...(query.category ? { category: { slug: query.category } } : {}), ...(query.search ? { OR: [{ title: { contains: query.search, mode: 'insensitive' } }, { excerpt: { contains: query.search, mode: 'insensitive' } }] } : {}) };
  const [items, total] = await prisma.$transaction([prisma.news.findMany({ where, select: summary, take: query.limit, skip: (query.page - 1) * query.limit, orderBy: [{ publishedAt: 'desc' }, { id: 'asc' }] }), prisma.news.count({ where })]);
  res.json({ success: true, data: { items, total, page: query.page, limit: query.limit, category }, requestId: req.id });
});
publicNewsRouter.get('/categories', async (req, res) => {
  const items = await prisma.newsCategory.findMany({ where: { archived: false, news: { some: { status: 'PUBLISHED' } } }, select: { slug: true, name: true }, orderBy: [{ name: 'asc' }, { id: 'asc' }], take: 500 });
  res.json({ success: true, data: { items }, requestId: req.id });
});
publicNewsRouter.get('/sitemap', async (req, res) => {
  const where = { status: 'PUBLISHED' as const };
  if (await prisma.news.count({ where }) > 49000) throw new CmsError(503, 'SITEMAP_LIMIT', 'Sitemap index required');
  const items = await prisma.news.findMany({ where, select: { slug: true, updatedAt: true }, orderBy: { id: 'asc' }, take: 49000 });
  res.json({ success: true, data: { items }, requestId: req.id });
});
publicNewsRouter.get('/resolve/:slug', async (req, res) => {
  const slug = slugSchema.parse(req.params.slug);
  const current = await prisma.news.findUnique({ where: { slug }, select: { slug: true, status: true } });
  const target = current ?? (await prisma.newsSlugAlias.findUnique({ where: { slug }, select: { news: { select: { slug: true, status: true } } } }))?.news;
  if (!target || target.status !== 'PUBLISHED') throw new CmsError(404, 'NOT_FOUND', 'News not found');
  res.json({ success: true, data: { slug: target.slug }, requestId: req.id });
});
publicNewsRouter.get('/resolve-category/:slug', async (req, res) => {
  const slug = slugSchema.parse(req.params.slug);
  const category = await prisma.newsCategory.findFirst({ where: { slug, archived: false, news: { some: { status: 'PUBLISHED' } } }, select: { slug: true } });
  if (!category) throw new CmsError(404, 'NOT_FOUND', 'Category not found');
  res.json({ success: true, data: category, requestId: req.id });
});
publicNewsRouter.get('/redirect/:slug', async (req, res) => {
  const slug = slugSchema.parse(req.params.slug);
  const alias = await prisma.newsSlugAlias.findUnique({ where: { slug }, select: { news: { select: { slug: true, status: true } } } });
  if (!alias || alias.news.status !== 'PUBLISHED') throw new CmsError(404, 'NOT_FOUND', 'Redirect not found');
  res.json({ success: true, data: { slug: alias.news.slug }, requestId: req.id });
});
publicNewsRouter.get(['/articles/:slug', '/:slug'], async (req, res) => {
  const slug = slugSchema.parse(req.params.slug);
  const news = await prisma.news.findFirst({ where: { slug, status: 'PUBLISHED' }, select: { ...summary, bodyHtml: true } });
  if (!news) throw new CmsError(404, 'NOT_FOUND', 'News not found');
  const related = await prisma.news.findMany({ where: { status: 'PUBLISHED', slug: { not: slug }, category: { slug: news.category.slug } }, select: summary, take: 3, orderBy: [{ publishedAt: 'desc' }, { id: 'asc' }] });
  res.json({ success: true, data: { news: { ...news, bodyHtml: sanitizeBody(news.bodyHtml).html.replace(/(src="\/api\/v1\/public\/media\/[0-9a-f-]{36})"/g, '$1?variant=display"') }, related }, requestId: req.id });
});
