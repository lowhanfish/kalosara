import { CmsError } from '../lib/errors.js';
import { idSchema, pagination } from '../validators/common.validator.js';
import {
  newsAdminListQuerySchema,
  newsCategoryInput,
  newsRollbackInputSchema,
  newsSlugSchema,
  publicNewsListQuerySchema,
  sanitizeBody,
} from '../validators/cms.validator.js';
import {
  countPublishedNewsForSitemap,
  findNewsById,
  findNewsPreviewById,
  findNewsSlugRedirectAlias,
  findPublishedNewsBySlug,
  findPublishedNewsCategoryBySlug,
  listActivePublishedNewsCategories,
  listAdminNewsCategories,
  listAdminNewsItems,
  listNewsRevisionsById,
  listPublishedNewsForSitemap,
  listPublishedNewsWithCount,
  listRelatedPublishedNews,
  resolveNewsSlugOrAlias,
  rollbackAdminNewsInTx,
  saveAdminNewsInTx,
  upsertNewsCategoryInTx,
} from '../repositories/cms-news.repository.js';
import {
  enqueueInvalidation,
  notifyInvalidation,
} from './cache-invalidation.service.js';

export async function listAdminCategoriesService(query: unknown) {
  const parsed = pagination.parse(query);
  const [items, total] = await listAdminNewsCategories(
    parsed.page,
    parsed.limit,
    parsed.search,
  );
  return { items, total, page: parsed.page, limit: parsed.limit };
}

export async function saveAdminCategoryService(
  rawId: unknown,
  body: unknown,
  actorId: string,
) {
  const id = idSchema.parse(rawId);
  const input = newsCategoryInput.parse(body);
  const category = await upsertNewsCategoryInTx({
    id,
    input,
    actorId,
    enqueueCache: (tx) => enqueueInvalidation(tx),
  });
  const cacheInvalidated = await notifyInvalidation(category.event.id);
  return { category: category.result, cacheInvalidated };
}

export async function listAdminNewsService(query: unknown) {
  const parsed = newsAdminListQuerySchema.parse(query);
  const [items, total] = await listAdminNewsItems(parsed);
  return { items, total, page: parsed.page, limit: parsed.limit };
}

export async function getAdminNewsDetailService(rawId: unknown) {
  const id = idSchema.parse(rawId);
  const news = await findNewsById(id);
  if (!news) throw new CmsError(404, 'NOT_FOUND', 'News not found');
  return { news };
}

export async function listAdminNewsRevisionsService(
  rawId: unknown,
  query: unknown,
) {
  const newsId = idSchema.parse(rawId);
  const parsed = pagination.parse(query);
  const [items, total] = await listNewsRevisionsById(
    newsId,
    parsed.page,
    parsed.limit,
  );
  return { items, total, page: parsed.page, limit: parsed.limit };
}

export async function saveAdminNewsService(
  rawId: unknown,
  body: unknown,
  actorId: string,
) {
  const id = idSchema.parse(rawId);
  const news = await saveAdminNewsInTx({
    id,
    body,
    actorId,
    enqueueCache: (tx) => enqueueInvalidation(tx),
  });
  return {
    news: news.news,
    cacheInvalidated: await notifyInvalidation(news.event.id),
  };
}

export async function rollbackAdminNewsService(
  rawId: unknown,
  body: unknown,
  actorId: string,
) {
  const newsId = idSchema.parse(rawId);
  const input = newsRollbackInputSchema.parse(body);
  const news = await rollbackAdminNewsInTx({
    newsId,
    revisionId: input.revisionId,
    expectedVersion: input.expectedVersion,
    actorId,
    enqueueCache: (tx) => enqueueInvalidation(tx),
  });
  return {
    news: news.news,
    cacheInvalidated: await notifyInvalidation(news.event.id),
  };
}

// Authenticated preview uses only server-sanitized saved content. Never a public preview token/URL.
export async function getAdminNewsPreviewService(rawId: unknown) {
  const id = idSchema.parse(rawId);
  const news = await findNewsPreviewById(id);
  if (!news) throw new CmsError(404, 'NOT_FOUND', 'News not found');
  return {
    news: { ...news, bodyHtml: sanitizeBody(news.bodyHtml).html },
  };
}

export async function listPublicNewsService(query: unknown) {
  const parsed = publicNewsListQuerySchema.parse(query);
  let category: { name: string; slug: string } | null = null;
  if (parsed.category) {
    category = await findPublishedNewsCategoryBySlug(parsed.category);
    if (!category) throw new CmsError(404, 'NOT_FOUND', 'Category not found');
  }
  const [items, total] = await listPublishedNewsWithCount(parsed);
  return { items, total, page: parsed.page, limit: parsed.limit, category };
}

export async function listPublicNewsCategoriesService() {
  const items = await listActivePublishedNewsCategories();
  return { items };
}

export async function getPublicNewsSitemapService() {
  if ((await countPublishedNewsForSitemap()) > 49000) {
    throw new CmsError(503, 'SITEMAP_LIMIT', 'Sitemap index required');
  }
  const items = await listPublishedNewsForSitemap();
  return { items };
}

export async function resolvePublicNewsSlugService(rawSlug: unknown) {
  const slug = newsSlugSchema.parse(rawSlug);
  const target = await resolveNewsSlugOrAlias(slug);
  if (!target || target.status !== 'PUBLISHED') {
    throw new CmsError(404, 'NOT_FOUND', 'News not found');
  }
  return { slug: target.slug };
}

export async function resolvePublicNewsCategorySlugService(rawSlug: unknown) {
  const slug = newsSlugSchema.parse(rawSlug);
  const category = await findPublishedNewsCategoryBySlug(slug);
  if (!category) throw new CmsError(404, 'NOT_FOUND', 'Category not found');
  return { slug: category.slug };
}

export async function getPublicNewsRedirectService(rawSlug: unknown) {
  const slug = newsSlugSchema.parse(rawSlug);
  const alias = await findNewsSlugRedirectAlias(slug);
  if (!alias || alias.news.status !== 'PUBLISHED') {
    throw new CmsError(404, 'NOT_FOUND', 'Redirect not found');
  }
  return { slug: alias.news.slug };
}

export async function getPublicNewsArticleService(rawSlug: unknown) {
  const slug = newsSlugSchema.parse(rawSlug);
  const news = await findPublishedNewsBySlug(slug);
  if (!news) throw new CmsError(404, 'NOT_FOUND', 'News not found');
  const related = await listRelatedPublishedNews(slug, news.category.slug);
  return {
    news: {
      ...news,
      bodyHtml: sanitizeBody(news.bodyHtml).html.replace(
        /(src="\/api\/v1\/public\/media\/[0-9a-f-]{36})"/g,
        '$1?variant=display"',
      ),
    },
    related,
  };
}
