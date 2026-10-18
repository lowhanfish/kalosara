import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email());
export const phoneSchema = z.string().trim().regex(/^\+[1-9]\d{7,14}$/);
export const passwordSchema = z.string().min(12).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password exceeds bcrypt limit');
