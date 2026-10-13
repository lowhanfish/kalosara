import 'dotenv/config';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../modules/auth/password.js';
import { emailSchema, passwordSchema } from '../modules/auth/validation.js';

const input = z.object({
  PROVISION_ROLE: z.enum(['LURAH', 'ADMIN_KELURAHAN']),
  PROVISION_EMAIL: emailSchema,
  PROVISION_PASSWORD: passwordSchema,
  PROVISION_ACK_VERIFIED: z.literal('true'),
}).safeParse(process.env);

if (!input.success) {
  console.error('Provisioning requires a staff role, valid email, strong password, and verified identity acknowledgement.');
  process.exitCode = 2;
} else {
  try {
    const passwordHash = await hashPassword(input.data.PROVISION_PASSWORD);
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: input.data.PROVISION_EMAIL,
          passwordHash,
          role: input.data.PROVISION_ROLE,
          verifiedAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: { action: 'STAFF_PROVISIONED', resourceType: 'User', resourceId: created.id },
      });
      return created;
    });
    console.log(`Provisioned ${user.role} account ${user.id}`);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      console.error('Account already exists.');
    } else {
      console.error('Provisioning failed.');
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
