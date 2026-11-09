import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { CmsError } from '../lib/errors.js';
import { mediaUrl } from '../validators/common.validator.js';
import { newsInput, sanitizeBody } from '../validators/cms.validator.js';
import { assertPublicImages, transaction } from './common.repository.js';

export const publicNewsSummarySelect = {
  slug: true,
  title: true,
  excerpt: true,
  publishedAt: true,
  updatedAt: true,
  category: { select: { name: true, slug: true } },
  cover: { select: { id: true, alt: true, caption: true } },
} as const;

export async function listAdminNewsCategories(
  page: number,
  limit: number,
  search: string,
) {
  const where = { name: { contains: search, mode: 'insensitive' as const } };
  return prisma.$transaction([
    prisma.newsCategory.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    }),
    prisma.newsCategory.count({ where }),
  ]);
}

export async function upsertNewsCategoryInTx(params: {
  id: string;
  input: { name: string; slug: string; archived: boolean };
  actorId: string;
  enqueueCache: (tx: Prisma.TransactionClient) => Promise<{ id: string }>;
}) {
  return transaction(async (tx) => {
    const current = await tx.newsCategory.findUnique({
      where: { id: params.id },
    });
    if (current && current.slug !== params.input.slug) {
      throw new CmsError(400, 'SLUG_IMMUTABLE', 'Category slug cannot change');
    }
    if (
      params.input.archived &&
      (await tx.news.count({
        where: { categoryId: params.id, status: { not: 'ARCHIVED' } },
      }))
    ) {
      throw new CmsError(
        409,
        'CATEGORY_IN_USE',
        'Archive its news before archiving this category',
      );
    }
    const result = await tx.newsCategory.upsert({
      where: { id: params.id },
      create: { id: params.id, ...params.input },
      update: params.input,
    });
    await tx.auditLog.create({
      data: {
        actorId: params.actorId,
        action: 'NEWS_CATEGORY_SAVED',
        resourceType: 'NewsCategory',
        resourceId: params.id,
      },
    });
    const event = await params.enqueueCache(tx);
    return { result, event };
  });
}

export async function listAdminNewsItems(params: {
  page: number;
  limit: number;
  search: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  categoryId?: string;
  sort: 'newest' | 'oldest' | 'title';
}) {
  const where: Prisma.NewsWhereInput = {
    status: params.status,
    categoryId: params.categoryId,
    OR: [
      { title: { contains: params.search, mode: 'insensitive' } },
      { slug: { contains: params.search, mode: 'insensitive' } },
    ],
  };
  const orderBy: Prisma.NewsOrderByWithRelationInput[] =
    params.sort === 'title'
      ? [{ title: 'asc' }, { id: 'asc' }]
      : [
          { updatedAt: params.sort === 'oldest' ? 'asc' : 'desc' },
          { id: 'asc' },
        ];
  return prisma.$transaction([
    prisma.news.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        version: true,
        updatedAt: true,
        category: { select: { name: true } },
      },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      orderBy,
    }),
    prisma.news.count({ where }),
  ]);
}

export async function findNewsById(id: string) {
  return prisma.news.findUnique({ where: { id } });
}

export async function listNewsRevisionsById(
  newsId: string,
  page: number,
  limit: number,
) {
  return prisma.$transaction([
    prisma.newsRevision.findMany({
      where: { newsId },
      select: { id: true, version: true, createdAt: true },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { version: 'desc' },
    }),
    prisma.newsRevision.count({ where: { newsId } }),
  ]);
}

export async function saveNewsRecordInTx(
  tx: Prisma.TransactionClient,
  id: string,
  raw: unknown,
  actorId: string,
  enqueueCache: (tx: Prisma.TransactionClient) => Promise<{ id: string }>,
) {
  const input = newsInput.parse(raw);
  const current = await tx.news.findUnique({ where: { id } });
  if ((current?.version ?? 0) !== input.expectedVersion) {
    throw new CmsError(
      409,
      'VERSION_CONFLICT',
      'News changed; reload before saving',
    );
  }
  const reserved = await tx.newsSlugAlias.findUnique({
    where: { slug: input.slug },
  });
  if (reserved && reserved.newsId !== id) {
    throw new CmsError(
      409,
      'SLUG_RESERVED',
      'Slug belongs to another article history',
    );
  }
  if (current && current.slug !== input.slug) {
    if (
      await tx.news.findFirst({ where: { slug: input.slug, id: { not: id } } })
    ) {
      throw new CmsError(409, 'SLUG_RESERVED', 'Slug already in use');
    }
    if (reserved)
      await tx.newsSlugAlias.delete({ where: { slug: input.slug } });
    await tx.newsSlugAlias.upsert({
      where: { slug: current.slug },
      create: { slug: current.slug, newsId: id },
      update: {},
    });
  }
  const category = await tx.newsCategory.findUnique({
    where: { id: input.categoryId },
  });
  if (!category || category.archived) {
    throw new CmsError(400, 'INVALID_CATEGORY', 'Choose an active category');
  }
  const body = sanitizeBody(input.bodyHtml);
  const mediaIds = [
    ...new Set([...body.mediaIds, ...(input.coverId ? [input.coverId] : [])]),
  ];
  await assertPublicImages(mediaIds.map(mediaUrl), tx);
  if (
    input.status === 'PUBLISHED' &&
    (!input.excerpt || !body.html.replace(/<[^>]*>/g, '').trim())
  ) {
    throw new CmsError(
      400,
      'INCOMPLETE_NEWS',
      'Published news requires an excerpt and body text',
    );
  }
  const version = (current?.version ?? 0) + 1;
  const { expectedVersion: _version, ...fields } = input;
  const data = {
    ...fields,
    bodyHtml: body.html,
    version,
    publishedAt:
      input.status === 'PUBLISHED'
        ? (current?.publishedAt ?? new Date())
        : (current?.publishedAt ?? null),
  };
  const news = await tx.news.upsert({
    where: { id },
    create: { id, authorId: actorId, ...data },
    update: data,
  });
  await tx.newsMedia.deleteMany({ where: { newsId: id } });
  if (mediaIds.length) {
    await tx.newsMedia.createMany({
      data: mediaIds.map((mediaId) => ({ newsId: id, mediaId })),
    });
  }
  await tx.newsRevision.create({
    data: {
      newsId: id,
      version,
      editorId: actorId,
      mediaIds,
      snapshot: { ...fields, bodyHtml: body.html },
    },
  });
  await tx.auditLog.create({
    data: {
      actorId,
      action: 'NEWS_SAVED',
      resourceType: 'News',
      resourceId: id,
    },
  });
  const event = await enqueueCache(tx);
  return { news, event };
}

export async function saveAdminNewsInTx(params: {
  id: string;
  body: unknown;
  actorId: string;
  enqueueCache: (tx: Prisma.TransactionClient) => Promise<{ id: string }>;
}) {
  return transaction((tx) =>
    saveNewsRecordInTx(
      tx,
      params.id,
      params.body,
      params.actorId,
      params.enqueueCache,
    ),
  );
}

export async function rollbackAdminNewsInTx(params: {
  newsId: string;
  revisionId: string;
  expectedVersion: number;
  actorId: string;
  enqueueCache: (tx: Prisma.TransactionClient) => Promise<{ id: string }>;
}) {
  return transaction(async (tx) => {
    const revision = await tx.newsRevision.findFirst({
      where: { id: params.revisionId, newsId: params.newsId },
    });
    if (!revision)
      throw new CmsError(404, 'NOT_FOUND', 'Revision not found for this news');
    const snapshot = revision.snapshot as Prisma.JsonObject;
    const current = await tx.news.findUniqueOrThrow({
      where: { id: params.newsId },
      select: { slug: true },
    });
    const result = await saveNewsRecordInTx(
      tx,
      params.newsId,
      {
        ...snapshot,
        slug: current.slug,
        status: 'DRAFT',
        expectedVersion: params.expectedVersion,
      },
      params.actorId,
      params.enqueueCache,
    );
    await tx.auditLog.create({
      data: {
        actorId: params.actorId,
        action: 'NEWS_ROLLED_BACK',
        resourceType: 'News',
        resourceId: params.newsId,
      },
    });
    return result;
  });
}

export async function findNewsPreviewById(id: string) {
  return prisma.news.findUnique({
    where: { id },
    select: {
      title: true,
      excerpt: true,
      bodyHtml: true,
      status: true,
      cover: { select: { id: true, alt: true, caption: true } },
    },
  });
}

export async function findPublishedNewsCategoryBySlug(slug: string) {
  return prisma.newsCategory.findFirst({
    where: { slug, archived: false, news: { some: { status: 'PUBLISHED' } } },
    select: { name: true, slug: true },
  });
}

export async function listPublishedNewsWithCount(params: {
  page: number;
  limit: number;
  search: string;
  category?: string;
}) {
  const where: Prisma.NewsWhereInput = {
    status: 'PUBLISHED',
    ...(params.category ? { category: { slug: params.category } } : {}),
    ...(params.search
      ? {
          OR: [
            { title: { contains: params.search, mode: 'insensitive' } },
            { excerpt: { contains: params.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  return prisma.$transaction([
    prisma.news.findMany({
      where,
      select: publicNewsSummarySelect,
      take: params.limit,
      skip: (params.page - 1) * params.limit,
      orderBy: [{ publishedAt: 'desc' }, { id: 'asc' }],
    }),
    prisma.news.count({ where }),
  ]);
}

export async function listActivePublishedNewsCategories() {
  return prisma.newsCategory.findMany({
    where: { archived: false, news: { some: { status: 'PUBLISHED' } } },
    select: { slug: true, name: true },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    take: 500,
  });
}

export async function countPublishedNewsForSitemap() {
  return prisma.news.count({ where: { status: 'PUBLISHED' } });
}

export async function listPublishedNewsForSitemap() {
  return prisma.news.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, updatedAt: true },
    orderBy: { id: 'asc' },
    take: 49000,
  });
}

export async function resolveNewsSlugOrAlias(slug: string) {
  const current = await prisma.news.findUnique({
    where: { slug },
    select: { slug: true, status: true },
  });
  return (
    current ??
    (
      await prisma.newsSlugAlias.findUnique({
        where: { slug },
        select: { news: { select: { slug: true, status: true } } },
      })
    )?.news
  );
}

export async function findNewsSlugRedirectAlias(slug: string) {
  return prisma.newsSlugAlias.findUnique({
    where: { slug },
    select: { news: { select: { slug: true, status: true } } },
  });
}

export async function findPublishedNewsBySlug(slug: string) {
  return prisma.news.findFirst({
    where: { slug, status: 'PUBLISHED' },
    select: { ...publicNewsSummarySelect, bodyHtml: true },
  });
}

export async function listRelatedPublishedNews(
  excludeSlug: string,
  categorySlug: string,
) {
  return prisma.news.findMany({
    where: {
      status: 'PUBLISHED',
      slug: { not: excludeSlug },
      category: { slug: categorySlug },
    },
    select: publicNewsSummarySelect,
    take: 3,
    orderBy: [{ publishedAt: 'desc' }, { id: 'asc' }],
  });
}
