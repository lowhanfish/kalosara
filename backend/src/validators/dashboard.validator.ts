import { z } from 'zod';
import { emailSchema, passwordSchema } from './auth.validator.js';

export const userRoleSchema = z.enum([
  'MASYARAKAT',
  'LURAH',
  'ADMIN_KELURAHAN',
]);

export const createUserSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    role: userRoleSchema.default('ADMIN_KELURAHAN'),
    displayName: z.string().trim().min(1).max(120).optional(),
    currentPassword: z.string().min(1).max(72),
  })
  .strict();

export const accessSchema = z
  .object({
    action: z.enum([
      'ACTIVATE',
      'DEACTIVATE',
      'REVOKE_SESSIONS',
      'RESET_PASSWORD',
      'SET_ROLE',
    ]),
    currentPassword: z.string().min(1).max(72),
    expectedUpdatedAt: z.iso.datetime(),
    identityVerified: z.literal(true),
    newPassword: passwordSchema.optional(),
    role: userRoleSchema.optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      (v.action === 'RESET_PASSWORD') !== !!v.newPassword ||
      (v.action === 'SET_ROLE') !== !!v.role
    ) {
      ctx.addIssue({ code: 'custom', message: 'Action fields do not match' });
    }
  });
