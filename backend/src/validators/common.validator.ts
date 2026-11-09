import { z } from 'zod';

export const idSchema = z.uuid().transform((value) => value.toLowerCase());

export const pagination = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(100).default(''),
});

export const mediaUrl = (id: string) => `/api/v1/public/media/${id}`;

export const mediaUrlSchema = z
  .string()
  .regex(/^\/api\/v1\/public\/media\/[0-9a-f-]{36}$/i)
  .refine((v) => idSchema.safeParse(v.split('/').at(-1)).success)
  .transform((value) => value.toLowerCase());

export const passwordProofSchema = z.string().min(1).max(72);

export const safeTextSchema = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (v) =>
        Array.from(v).every((c) => {
          const code = c.charCodeAt(0);
          return (code >= 32 && code !== 127) || [9, 10, 13].includes(code);
        }),
      'Control characters are not allowed',
    );
