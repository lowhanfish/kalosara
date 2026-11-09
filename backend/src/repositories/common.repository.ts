import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AccessError, CmsError } from '../lib/errors.js';
import { idSchema } from '../validators/common.validator.js';

// Access changes, login and refresh share this lock. Read Committed transactions
// re-read account/session state after acquiring it, so a reset cannot miss a new session.
export async function lockAccount(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<void> {
  await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId}::uuid FOR UPDATE`;
}

// Serialize administrative access changes, including last-active-admin checks.
export async function acquireAdminAdvisoryLock(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(1195461711)`;
}

export async function transaction<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  try {
    return await prisma.$transaction(work, { isolationLevel: 'Serializable' });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (['P2002', 'P2034'].includes(error.code)) {
        throw new AccessError(
          409,
          'CONFLICT',
          'Data changed or slug already exists; reload before saving',
        );
      }
      if (error.code === 'P2025') {
        throw new CmsError(404, 'NOT_FOUND', 'Resource not found');
      }
    }
    throw error;
  }
}

export async function assertPublicImages(
  urls: (string | null)[],
  tx: Prisma.TransactionClient = prisma,
): Promise<void> {
  const ids = [
    ...new Set(
      urls
        .filter(
          (v): v is string => !!v && v.startsWith('/api/v1/public/media/'),
        )
        .map((v) => idSchema.parse(v.split('/').at(-1))),
    ),
  ];
  if (!ids.length) return;
  const count = await tx.mediaAsset.count({
    where: {
      id: { in: ids },
      visibility: 'PUBLIC',
      archived: false,
      mimeType: { startsWith: 'image/' },
    },
  });
  if (count !== ids.length) {
    throw new CmsError(
      400,
      'INVALID_MEDIA',
      'Only active public images may be embedded',
    );
  }
}
