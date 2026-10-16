import { createHmac } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
export type PublicCacheTag = 'news' | 'site-settings' | 'public-profile' | 'public-content';
export function enqueueInvalidation(tx: Prisma.TransactionClient, tags: PublicCacheTag[] = ['news']) {
  return tx.cacheInvalidation.create({ data: { tags: [...new Set(tags)] }, select: { id: true } });
}
export function signInvalidation(timestamp: string, body: string, secret: string) {
  return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}
export async function deliverInvalidation(id: string): Promise<boolean> {
  const event = await prisma.cacheInvalidation.findUnique({ where: { id } });
  if (!event || event.deliveredAt) return true;
  let delivered = false;
  if (env.CACHE_INVALIDATION_SECRET) {
    const body = JSON.stringify({ id: event.id, tags: event.tags }); const timestamp = Date.now().toString();
    try {
      const response = await fetch(new URL('/api/internal/revalidate', env.FRONTEND_INTERNAL_URL), {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Cache-Timestamp': timestamp, 'X-Cache-Signature': signInvalidation(timestamp, body, env.CACHE_INVALIDATION_SECRET) }, body, signal: AbortSignal.timeout(2000), redirect: 'error',
      });
      const reply = await response.json().catch(() => null);
      delivered = response.ok && typeof reply === 'object' && reply !== null && 'revalidated' in reply && reply.revalidated === true && 'id' in reply && reply.id === event.id;
    } catch { /* Retained in DB for retry; no tokens/body in logs. */ }
  }
  await prisma.cacheInvalidation.updateMany({ where: { id, deliveredAt: null }, data: { attempts: { increment: 1 }, ...(delivered ? { deliveredAt: new Date() } : { nextAttemptAt: new Date(Date.now() + Math.min(300000, 30000 * 2 ** Math.min(event.attempts, 4))) }) } });
  if (!delivered) logger.warn({ eventId: id }, 'Public cache invalidation pending');
  return delivered;
}
let draining = false;
export async function drainInvalidations() {
  if (draining) return;
  draining = true;
  try {
    const events = await prisma.cacheInvalidation.findMany({ where: { deliveredAt: null, nextAttemptAt: { lte: new Date() } }, take: 10, orderBy: { createdAt: 'asc' }, select: { id: true } });
    for (const event of events) await deliverInvalidation(event.id);
    await prisma.cacheInvalidation.deleteMany({ where: { deliveredAt: { lt: new Date(Date.now() - 7 * 86400000) } } });
  } catch (error) { logger.warn({ err: error }, 'Public cache retry unavailable'); }
  finally { draining = false; }
}
// Notification failure must never turn an already committed CMS save into an HTTP error.
export async function notifyInvalidation(id: string) {
  try { return await deliverInvalidation(id); }
  catch { logger.warn({ eventId: id }, 'Public cache notification deferred'); return false; }
}
