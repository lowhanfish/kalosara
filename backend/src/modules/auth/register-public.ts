import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { hashPassword } from './password.js';
import { emailSchema, passwordSchema, phoneSchema } from './validation.js';

export const publicRegistrationSchema = z.object({
  email: emailSchema,
  phone: phoneSchema.optional(),
  password: passwordSchema,
  displayName: z.string().trim().min(1).max(120).optional(),
});

type NewPublicAccount = {
  email: string;
  phone?: string;
  passwordHash: string;
  role: 'MASYARAKAT';
  displayName?: string;
};

export interface PublicAccountRepository {
  create(data: NewPublicAccount): Promise<{ id: string; email: string; role: 'MASYARAKAT' }>;
}

const prismaRepository: PublicAccountRepository = {
  async create(data) {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash: data.passwordHash,
        role: data.role,
        profile: data.displayName ? { create: { displayName: data.displayName } } : undefined,
      },
      select: { id: true, email: true, role: true },
    });
    return { id: user.id, email: user.email, role: 'MASYARAKAT' };
  },
};

export async function registerPublicAccount(
  input: unknown,
  dependencies: { repository?: PublicAccountRepository; hash?: (password: string) => Promise<string> } = {},
) {
  const parsed = publicRegistrationSchema.parse(input);
  const passwordHash = await (dependencies.hash ?? hashPassword)(parsed.password);
  return (dependencies.repository ?? prismaRepository).create({
    email: parsed.email,
    phone: parsed.phone,
    passwordHash,
    role: 'MASYARAKAT',
    displayName: parsed.displayName,
  });
}
