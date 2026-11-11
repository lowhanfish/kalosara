import { z } from 'zod';

export const letterTypeEnum = z.enum([
  'SKU',
  'SKTM',
  'DOMISILI',
  'PENGANTAR_SKCK',
  'BELUM_MENIKAH',
  'BELUM_BEKERJA',
  'PENGHASILAN',
  'PENGANTAR_NIKAH',
  'AHLI_WARIS',
  'LAINNYA',
]);

export const letterStatusEnum = z.enum([
  'SUBMITTED',
  'REJECTED',
  'VERIFIED',
  'SIGNED',
]);

export const citizenCreateLetterSchema = z.object({
  type: letterTypeEnum,
  applicantName: z.string().min(2).max(120),
  applicantNik: z.string().min(16).max(20),
  birthPlace: z.string().min(2).max(100),
  birthDate: z.string().min(4).max(20),
  gender: z.string().min(1).max(20),
  religion: z.string().min(1).max(30),
  maritalStatus: z.string().min(1).max(30),
  occupation: z.string().min(1).max(100),
  address: z.string().min(3).max(500),
  details: z.record(z.string(), z.unknown()).default({}),
});

export const adminLetterActionSchema = z.object({
  action: z.enum(['VERIFY', 'REJECT', 'SIGN']),
  reason: z.string().max(1000).optional(),
});

export const listLettersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: letterStatusEnum.optional(),
  type: letterTypeEnum.optional(),
});
