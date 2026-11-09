import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email());

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/);

export const passwordSchema = z
  .string()
  .min(12)
  .refine(
    (value) => Buffer.byteLength(value, 'utf8') <= 72,
    'Password exceeds bcrypt limit',
  );

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const publicRegistrationSchema = z.object({
  email: emailSchema,
  phone: phoneSchema.optional(),
  password: passwordSchema,
  displayName: z.string().trim().min(1).max(120).optional(),
});
