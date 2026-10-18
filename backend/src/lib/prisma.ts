import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';
import { auditContext } from './audit-context.js';
// Query-only extension preserves the generated client API, including transactions.
// Bound every runtime pool without changing the operator's DATABASE_URL file.
const runtimeUrl = new URL(env.DATABASE_URL);
runtimeUrl.searchParams.set('connection_limit', '3');
runtimeUrl.searchParams.set('pool_timeout', '10');
runtimeUrl.searchParams.set('connect_timeout', '10');
export const prisma: PrismaClient = new PrismaClient({ datasourceUrl: runtimeUrl.toString() }).$extends({
  query: { auditLog: { create({ args, query }) {
    const context = auditContext.getStore();
    if (context) args.data = { ...args.data, ...context };
    return query(args);
  } } },
}) as unknown as PrismaClient;
