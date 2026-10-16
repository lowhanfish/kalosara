import { afterEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { deliverInvalidation } from '../modules/cms/cache-invalidation.js';
const original = env.CACHE_INVALIDATION_SECRET;
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); env.CACHE_INVALIDATION_SECRET = original; });
describe('durable cache invalidation delivery', () => {
  const id = '9cad3488-0dab-4b40-9537-f177765fe067';
  function event() { return { id, tags:['news'],createdAt:new Date(),deliveredAt:null,attempts:0,nextAttemptAt:new Date() }; }
  it('marks delivery only after successful HMAC webhook, keeping secret out of body', async () => {
    env.CACHE_INVALIDATION_SECRET = 'test-only-secret-at-least-32-characters';
    vi.spyOn(prisma.cacheInvalidation,'findUnique').mockResolvedValue(event());
    const update=vi.spyOn(prisma.cacheInvalidation,'updateMany').mockResolvedValue({count:1});
    const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({revalidated:true,id})});vi.stubGlobal('fetch',fetcher);
    expect(await deliverInvalidation(id)).toBe(true);
    const options=fetcher.mock.calls[0][1];expect(options.headers['X-Cache-Signature']).toMatch(/^[a-f0-9]{64}$/);expect(options.body).not.toContain(env.CACHE_INVALIDATION_SECRET);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({deliveredAt:expect.any(Date)})}));
  });
  it('retains failed delivery with bounded retry scheduling rather than losing invalidation',async()=>{
    env.CACHE_INVALIDATION_SECRET = 'test-only-secret-at-least-32-characters';
    vi.spyOn(prisma.cacheInvalidation,'findUnique').mockResolvedValue(event());
    const update=vi.spyOn(prisma.cacheInvalidation,'updateMany').mockResolvedValue({count:1});
    vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));
    expect(await deliverInvalidation(id)).toBe(false);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({where:{id,deliveredAt:null},data:expect.objectContaining({nextAttemptAt:expect.any(Date),attempts:{increment:1}})}));
    expect(update.mock.calls[0][0].data).not.toHaveProperty('deliveredAt');
  });
});
