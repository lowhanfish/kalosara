import type { Prisma } from '@prisma/client';
// Access changes, login and refresh share this lock. Read Committed transactions
// re-read account/session state after acquiring it, so a reset cannot miss a new session.
export async function lockAccount(tx: Prisma.TransactionClient, userId: string) {
  await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId}::uuid FOR UPDATE`;
}
