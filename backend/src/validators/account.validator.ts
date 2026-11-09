import { z } from 'zod';
import { emailSchema, passwordSchema, phoneSchema } from './auth.validator.js';
import { passwordProofSchema, safeTextSchema } from './common.validator.js';

export const accountProfileSchema = z
  .object({
    displayName: safeTextSchema(120).refine((v) => v.length > 0),
    address: safeTextSchema(500).nullable(),
    expectedUpdatedAt: z.iso.datetime(),
  })
  .strict();

export const contactChangeSchema = z
  .object({
    newEmail: emailSchema.optional(),
    newPhone: phoneSchema.optional(),
    currentPassword: passwordProofSchema,
  })
  .strict()
  .refine((v) => !!v.newEmail || !!v.newPhone);

export const passwordChangeSchema = z
  .object({
    currentPassword: passwordProofSchema,
    newPassword: passwordSchema,
    revokeOtherSessions: z.boolean(),
  })
  .strict();

export const contactReviewSchema = z
  .object({
    decision: z.enum(['APPROVE', 'REJECT']),
    currentPassword: passwordProofSchema,
    identityVerified: z.literal(true),
    contactOwnershipVerified: z.boolean(),
  })
  .strict()
  .refine((v) => v.decision !== 'APPROVE' || v.contactOwnershipVerified);
