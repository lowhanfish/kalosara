import { z } from 'zod';
import { pagination } from './common.validator.js';

export const guestTypeSchema = z.enum([
  'WARGA',
  'KEDINASAN',
  'SWASTA_LEMBAGA',
  'UMUM',
]);

export const guestStatusSchema = z.enum(['WAITING', 'SERVED', 'CANCELLED']);

export const guestbookInput = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, 'Nama lengkap minimal 3 karakter')
      .max(120, 'Nama lengkap maksimal 120 karakter'),
    phone: z
      .string()
      .trim()
      .min(9, 'Nomor HP minimal 9 digit')
      .max(30, 'Nomor HP maksimal 30 karakter')
      .regex(/^(\+?[\d ()-]{9,30})$/, 'Format nomor telepon tidak valid'),
    nik: z
      .string()
      .trim()
      .regex(/^\d{16}$/, 'NIK harus 16 digit')
      .optional()
      .or(z.literal('')),
    guestType: guestTypeSchema,
    institution: z.string().trim().max(200).optional().or(z.literal('')),
    addressOrRt: z.string().trim().max(200).optional().or(z.literal('')),
    purpose: z
      .string()
      .trim()
      .min(3, 'Keperluan minimal 3 karakter')
      .max(200, 'Keperluan maksimal 200 karakter'),
    destinationStaff: z
      .string()
      .trim()
      .min(3, 'Tujuan seksi minimal 3 karakter')
      .max(200, 'Tujuan seksi maksimal 200 karakter'),
    notes: z.string().trim().max(2000).optional().or(z.literal('')),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      (v.guestType === 'KEDINASAN' || v.guestType === 'SWASTA_LEMBAGA') &&
      (!v.institution || v.institution.trim().length === 0)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Nama instansi atau lembaga wajib diisi untuk kategori ini',
        path: ['institution'],
      });
    }
  });

export const guestbookStatusUpdate = z
  .object({
    status: guestStatusSchema,
    internalNote: z.string().trim().max(2000).optional(),
    servedBy: z.string().trim().max(120).optional(),
  })
  .strict();

export const guestbookQuery = pagination.extend({
  status: guestStatusSchema.optional(),
  guestType: guestTypeSchema.optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .optional(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Format bulan harus YYYY-MM')
    .optional(),
  year: z
    .string()
    .regex(/^\d{4}$/, 'Format tahun harus YYYY')
    .optional(),
  limit: z.coerce.number().int().min(1).max(500).default(10),
});
