import { PrismaClient } from '@prisma/client';
import { auditContext } from './audit-context.js';
// Query-only extension preserves the generated client API, including transactions.
export const prisma: PrismaClient = new PrismaClient().$extends({
  query: { auditLog: { create({ args, query }) {
    const context = auditContext.getStore();
    if (context) args.data = { ...args.data, ...context };
    return query(args);
  } } },
}) as unknown as PrismaClient;
