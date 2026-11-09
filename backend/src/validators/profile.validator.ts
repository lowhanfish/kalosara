import { z } from 'zod';
import { mediaUrlSchema } from './common.validator.js';

const text = z.string().trim().min(1).max(300);

// Reviewed static assets and database-validated public image uploads.
export const media = z.union([
  mediaUrlSchema,
  z.enum([
    '/images/watundehoa/amirulah.webp',
    '/images/watundehoa/kantor.webp',
    '/images/watundehoa/papan-kantor.webp',
    '/images/reference/crest.webp',
    '/images/watundehoa/konawe.png',
  ]),
]);

const httpsUrl = z
  .url()
  .max(500)
  .refine((v) => new URL(v).protocol === 'https:');

export const settingSchema = z
  .object({
    name: text,
    district: text,
    regency: text,
    address: text.nullable(),
    phone: z
      .string()
      .regex(/^\+?[\d ()-]{6,30}$/)
      .nullable(),
    email: z.email().nullable(),
    hours: text.nullable(),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    logoUrl: media.nullable(),
    heroUrl: media.nullable(),
    relatedLinks: z
      .array(z.object({ label: text, href: httpsUrl }).strict())
      .max(10),
  })
  .strict()
  .refine(
    (v) => (v.latitude === null) === (v.longitude === null),
    'Coordinates must be paired',
  );

export const pageSlug = z.enum([
  'sejarah',
  'visi-misi',
  'tugas-fungsi',
  'struktur-organisasi',
  'sambutan-lurah',
  'pelayanan',
]);

export const pageSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    content: z.string().trim().max(30000),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  })
  .strict();

export const officialSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    position: z.string().trim().min(1).max(160),
    unit: z.string().trim().min(1).max(160),
    sortOrder: z.number().int().min(0).max(10000),
    photoUrl: media.nullable(),
    active: z.boolean(),
    termStart: z.iso.date().nullable(),
    termEnd: z.iso.date().nullable(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  })
  .strict()
  .refine(
    (v) => !v.termStart || !v.termEnd || v.termStart <= v.termEnd,
    'Invalid term',
  );

export const defaultSettings = {
  name: 'Kelurahan Watundehoa',
  district: 'Kecamatan Puriala',
  regency: 'Kabupaten Konawe',
  address: 'Kelurahan Watundehoa, Kecamatan Puriala, Kabupaten Konawe',
  phone: null,
  email: null,
  hours: null,
  latitude: null,
  longitude: null,
  logoUrl: null,
  heroUrl: null,
  relatedLinks: [],
};
