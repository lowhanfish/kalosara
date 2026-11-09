import { z } from 'zod';
import { pagination } from './common.validator.js';

export const sectionSlug = z.enum(['anggaran', 'bansos', 'stunting']);

export const sectionInput = z
  .object({
    title: z.string().trim().min(1).max(160),
    content: z.string().trim().max(15000),
    period: z.string().trim().max(80),
    source: z.string().trim().max(300),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
    version: z.number().int().min(0),
    metrics: z
      .array(
        z
          .object({
            label: z.string().trim().min(1).max(100),
            value: z
              .number()
              .int()
              .min(0)
              .max(Number.MAX_SAFE_INTEGER)
              .nullable(),
            unit: z.enum(['Rp', 'orang', 'keluarga', 'program', 'kasus']),
          })
          .strict(),
      )
      .max(12),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      v.status === 'PUBLISHED' &&
      (!v.period ||
        !v.source ||
        (!v.content && !v.metrics.some((m) => m.value !== null)))
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Publication requires period, source and content or metrics',
      });
    }
  });

export const requestKindSchema = z.enum(['COMPLAINT', 'INFORMATION']);

export const requestInput = z
  .object({
    kind: requestKindSchema,
    name: z.string().trim().min(2).max(120),
    organization: z.string().trim().max(200).optional(),
    email: z.union([z.email().max(254), z.literal('')]).optional(),
    phone: z
      .union([z.string().regex(/^\+?[\d ()-]{6,30}$/), z.literal('')])
      .optional(),
    subject: z.string().trim().min(5).max(200),
    message: z.string().trim().min(20).max(5000),
    consent: z.literal(true),
  })
  .strict()
  .refine((v) => !!v.email || !!v.phone, 'Provide a contact for follow-up');

export const requestUpdate = z
  .object({
    status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED']),
    internalNote: z.string().trim().max(5000),
    expectedVersion: z.number().int().min(1),
  })
  .strict();

export const requestStatusSchema = requestUpdate.shape.status;

export const communityRequestsQuerySchema = pagination.extend({
  kind: requestKindSchema.optional(),
  status: requestStatusSchema.optional(),
});
