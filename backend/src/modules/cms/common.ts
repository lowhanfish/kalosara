import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { z } from 'zod';
import { AccessError } from '../auth/authorization.js';
export class CmsError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export const idSchema = z.uuid().transform(value => value.toLowerCase());
export const pagination = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(100).default(''),
});
export const mediaUrl = (id: string) => `/api/v1/public/media/${id}`;
export const mediaUrlSchema = z.string().regex(/^\/api\/v1\/public\/media\/[0-9a-f-]{36}$/i).refine(v => idSchema.safeParse(v.split('/').at(-1)).success).transform(value => value.toLowerCase());
export async function transaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  try { return await prisma.$transaction(work, { isolationLevel: 'Serializable' }); }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (['P2002', 'P2034'].includes(error.code)) throw new AccessError(409, 'CONFLICT', 'Data changed or slug already exists; reload before saving');
      if (error.code === 'P2025') throw new CmsError(404, 'NOT_FOUND', 'Resource not found');
    }
    throw error;
  }
}
export async function assertPublicImages(urls: (string | null)[], tx: Prisma.TransactionClient = prisma) {
  const ids = [...new Set(urls.filter((v): v is string => !!v && v.startsWith('/api/v1/public/media/')).map(v => idSchema.parse(v.split('/').at(-1))))];
  if (!ids.length) return;
  const count = await tx.mediaAsset.count({ where: { id: { in: ids }, visibility: 'PUBLIC', archived: false, mimeType: { startsWith: 'image/' } } });
  if (count !== ids.length) throw new CmsError(400, 'INVALID_MEDIA', 'Only active public images may be embedded');
}
