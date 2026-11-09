import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';
import { idSchema, mediaUrlSchema, pagination } from './common.validator.js';

export const uploadSources = [
  'news',
  'profile',
  'officials',
  'settings',
  'general',
  'announcements',
  'events',
  'galleries',
  'documents',
  'facilities',
  'potentials',
] as const;

export function sanitizeBody(input: string): {
  html: string;
  mediaIds: string[];
} {
  const mediaIds = new Set<string>();
  const html = sanitizeHtml(input, {
    allowedTags: [
      'p',
      'br',
      'h2',
      'h3',
      'strong',
      'em',
      's',
      'blockquote',
      'ul',
      'ol',
      'li',
      'a',
      'img',
    ],
    allowedAttributes: {
      a: ['href', 'rel', 'target'],
      img: ['src', 'alt', 'title', 'loading'],
    },
    allowedSchemes: ['https', 'http', 'mailto', 'tel'],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tag, attrs) => ({
        tagName: 'a',
        attribs: {
          href: attrs.href ?? '',
          rel: 'noopener noreferrer nofollow',
          target: '_blank',
        },
      }),
      img: (_tag, attrs) => {
        const parsed = mediaUrlSchema.safeParse(attrs.src);
        if (parsed.success) mediaIds.add(parsed.data.split('/').at(-1)!);
        return {
          tagName: 'img',
          attribs: parsed.success
            ? {
                src: parsed.data,
                alt: (attrs.alt ?? '').slice(0, 300),
                loading: 'lazy',
              }
            : ({} as Record<string, string>),
        };
      },
    },
    exclusiveFilter: (frame) => frame.tag === 'img' && !frame.attribs.src,
    enforceHtmlBoundary: true,
  });

  // Bound links too: sanitize-html handles encoding; enforce only explicit schemes, no relative/navigation tricks.
  const clean = sanitizeHtml(html, {
    allowedTags: [
      'p',
      'br',
      'h2',
      'h3',
      'strong',
      'em',
      's',
      'blockquote',
      'ul',
      'ol',
      'li',
      'a',
      'img',
    ],
    allowedAttributes: {
      a: ['href', 'rel', 'target'],
      img: ['src', 'alt', 'loading'],
    },
    allowedSchemes: ['https', 'http', 'mailto', 'tel'],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tag, attrs) => ({
        tagName: 'a',
        attribs: {
          ...attrs,
          href: /^(https?:\/\/|mailto:|tel:)/i.test(attrs.href ?? '')
            ? attrs.href
            : '',
        },
      }),
    },
  });

  return { html: clean, mediaIds: [...mediaIds] };
}

export const newsInput = z
  .object({
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(180),
    title: z.string().trim().min(1).max(200),
    excerpt: z.string().trim().max(1000),
    bodyHtml: z.string().max(60000),
    categoryId: idSchema,
    coverId: idSchema.nullable(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
    expectedVersion: z.number().int().min(0),
  })
  .strict();

export const newsCategoryInput = z
  .object({
    name: z.string().trim().min(1).max(120),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(100),
    archived: z.boolean(),
  })
  .strict();

export const newsAdminListQuerySchema = pagination.extend({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  categoryId: z.uuid().optional(),
  sort: z.enum(['newest', 'oldest', 'title']).default('newest'),
});

export const newsRollbackInputSchema = z
  .object({
    revisionId: z.uuid(),
    expectedVersion: z.number().int().min(1),
  })
  .strict();

export const newsSlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(180);

export const publicNewsListQuerySchema = pagination.extend({
  category: newsSlugSchema.optional(),
});

export const contentKindSchema = z.enum([
  'announcements',
  'events',
  'galleries',
  'documents',
]);

const isoDateWithOffset = z.iso.datetime({ offset: true });
const commonContentFields = {
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().max(30000),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  expectedVersion: z.number().int().min(0),
};

export const contentInput = z
  .discriminatedUnion('kind', [
    z
      .object({
        ...commonContentFields,
        kind: z.literal('announcements'),
        pinned: z.boolean(),
        startsAt: isoDateWithOffset.nullable(),
        expiredAt: isoDateWithOffset.nullable(),
      })
      .strict(),
    z
      .object({
        ...commonContentFields,
        kind: z.literal('events'),
        start: isoDateWithOffset,
        end: isoDateWithOffset,
        location: z.string().trim().min(1).max(300),
      })
      .strict(),
    z
      .object({
        ...commonContentFields,
        kind: z.literal('galleries'),
        photos: z
          .array(
            z
              .object({
                mediaId: idSchema,
                alt: z.string().trim().min(1).max(300),
              })
              .strict(),
          )
          .min(1)
          .max(12),
      })
      .strict(),
    z
      .object({
        ...commonContentFields,
        kind: z.literal('documents'),
        category: z.string().trim().min(1).max(120),
        classification: z
          .enum(['BERKALA', 'SERTA_MERTA', 'SETIAP_SAAT'])
          .nullable()
          .optional(),
        fileId: idSchema,
      })
      .strict(),
  ])
  .superRefine((input, ctx) => {
    if (
      input.kind === 'events' &&
      new Date(input.end) < new Date(input.start)
    ) {
      ctx.addIssue({ code: 'custom', message: 'End must follow start' });
    }
    if (
      input.kind === 'announcements' &&
      input.startsAt &&
      input.expiredAt &&
      new Date(input.expiredAt) <= new Date(input.startsAt)
    ) {
      ctx.addIssue({ code: 'custom', message: 'Expiry must follow start' });
    }
    if (
      input.kind === 'galleries' &&
      new Set(input.photos.map((p) => p.mediaId)).size !== input.photos.length
    ) {
      ctx.addIssue({ code: 'custom', message: 'Duplicate photo' });
    }
  });

export const contentListQuerySchema = pagination.extend({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  period: z.enum(['upcoming', 'past']).optional(),
  category: z.string().trim().max(120).optional(),
  classification: z.enum(['BERKALA', 'SERTA_MERTA', 'SETIAP_SAAT']).optional(),
});

const regionStatus = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
const aggregate = z.number().int().min(0).max(10_000_000).nullable();

export const statisticInput = z
  .object({
    period: z
      .string()
      .regex(/^\d{4}(?:-(?:0[1-9]|1[0-2]))?$/)
      .refine(
        (v) => Number(v.slice(0, 4)) >= 1900 && Number(v.slice(0, 4)) <= 2200,
      ),
    source: z.string().trim().min(1).max(300),
    referenceDate: z.iso.date(),
    population: aggregate,
    male: aggregate,
    female: aggregate,
    households: aggregate,
    rt: aggregate,
    rw: aggregate,
    status: regionStatus,
    expectedVersion: z.number().int().min(0),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      [v.population, v.male, v.female, v.households, v.rt, v.rw].every(
        (n) => n === null,
      )
    ) {
      ctx.addIssue({ code: 'custom', message: 'Enter at least one aggregate' });
    }
    if (
      v.population !== null &&
      v.male !== null &&
      v.female !== null &&
      v.male + v.female !== v.population
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Male and female totals must match population',
      });
    }
  });

export const placeInput = z
  .object({
    name: z.string().trim().min(1).max(160),
    description: z.string().trim().max(10000),
    category: z.string().trim().min(1).max(100),
    location: z.string().trim().min(1).max(300),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    photoId: idSchema.nullable(),
    photoAlt: z.string().trim().max(300),
    status: regionStatus,
    expectedVersion: z.number().int().min(0),
  })
  .strict()
  .superRefine((v, ctx) => {
    if ((v.latitude === null) !== (v.longitude === null)) {
      ctx.addIssue({ code: 'custom', message: 'Coordinates must be paired' });
    }
    if (v.photoId && !v.photoAlt) {
      ctx.addIssue({ code: 'custom', message: 'Photo alt is required' });
    }
  });

export const regionKindSchema = z.enum(['facilities', 'potentials']);

export const regionStatisticsQuerySchema = pagination.extend({
  status: regionStatus.optional(),
  period: z
    .string()
    .regex(/^\d{4}(?:-(?:0[1-9]|1[0-2]))?$/)
    .optional(),
});

export const regionPlacesQuerySchema = pagination.extend({
  status: regionStatus.optional(),
  category: z.string().trim().max(100).optional(),
});

export const mediaFieldsSchema = z
  .object({
    visibility: z.enum(['PUBLIC', 'PRIVATE']),
    alt: z.string().trim().max(300),
    caption: z.string().trim().max(1000),
  })
  .strict();

export const mediaUploadFieldsSchema = mediaFieldsSchema.extend({
  source: z.enum(uploadSources).default('general'),
});

export const mediaPatchSchema = mediaFieldsSchema
  .pick({ alt: true, caption: true })
  .extend({ archived: z.boolean() })
  .strict();

export const mediaListQuerySchema = pagination.extend({
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
});

export const mediaVariantSchema = z.enum(['thumb', 'display']).optional();
