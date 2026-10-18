import { PrismaClient } from '@prisma/client';
import { createServer } from 'node:http';
import { lockAccount } from '../modules/auth/account-lock.js';
import './db-safety.js';
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import { hash, compare } from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { createApp } from '../app.js';
// Observe blocked connections outside the deliberately small application pool.
const observer = new PrismaClient();
const app = createApp(); const server = createServer(app); const admin = request.agent(server); const lurah = request.agent(server); const citizen = request.agent(server);
const ids: string[] = []; const password = randomUUID() + '-Aa1!'; let headers: Record<string, string>; let target: { id: string; updatedAt: Date; email: string };
async function login(agent: ReturnType<typeof request.agent>, email: string, secret = password) {
  const csrf = (await agent.get('/api/v1/auth/csrf')).body.data.csrfToken;
  const h = { Origin: 'http://localhost:3000', 'X-CSRF-Token': csrf };
  await agent.post('/api/v1/auth/login').set(h).send({ email, password: secret }).expect(200); return h;
}
const accessPath = () => `/api/v1/admin/dashboard/users/${target.id}/access`;
async function input(action: string, extra = {}) {
  const row = await prisma.user.findUniqueOrThrow({ where: { id: target.id } });
  return { action, currentPassword: password, identityVerified: true, expectedUpdatedAt: row.updatedAt.toISOString(), ...extra };
}
beforeAll(async () => {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const passwordHash = await hash(password, 12);
  for (const [agent, role] of [[admin, 'ADMIN_KELURAHAN'], [lurah, 'LURAH'], [citizen, 'MASYARAKAT']] as const) {
    const user = await prisma.user.create({ data: { email: `dashboard-${randomUUID()}@example.invalid`, role, passwordHash } });
    ids.push(user.id); const h = await login(agent, user.email); if (agent === admin) headers = h; if (agent === citizen) target = user;
  }
}, 15000);
afterAll(async () => {
  await observer.$disconnect(); await prisma.mediaAsset.deleteMany({ where: { ownerId: { in: ids } } }); await prisma.auditLog.deleteMany({ where: { actorId: { in: ids } } }); await prisma.user.deleteMany({ where: { id: { in: ids } } }); await prisma.$disconnect(); await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });
describe('Prompt 11 direct dashboard API security', () => {
  it('blocks guests/citizens and allows monitoring only for lurah', async () => {
    for (const path of ['', '/users', '/audit', '/uploads']) {
      await request(server).get(`/api/v1/admin/dashboard${path}`).expect(401);
      await citizen.get(`/api/v1/admin/dashboard${path}`).expect(403);
      await lurah.get(`/api/v1/admin/dashboard${path}`).expect(path === '' ? 200 : 403);
      await admin.get(`/api/v1/admin/dashboard${path}`).expect(200);
    }
    expect((await citizen.get('/api/v1/auth/me').expect(200)).body.data.user.id).toBe(target.id);
    await citizen.get(`/api/v1/auth/me/${ids[0]}`).expect(404);
    await citizen.patch(`/api/v1/auth/me/${ids[0]}`).set(headers).send({ role: 'ADMIN_KELURAHAN' }).expect(404);
    await citizen.post(accessPath()).set(headers).send({}).expect(403);
    await lurah.post(accessPath()).set(headers).send({}).expect(403);
    for (const path of ['news', 'content/announcements', 'region/statistics', 'profile', 'media']) await lurah.get(`/api/v1/admin/${path}`).expect(403);
  });
  it('returns safe counts, private no-store and no approval or Tahap02 metrics', async () => {
    const r = await lurah.get('/api/v1/admin/dashboard').expect(200);
    expect(r.headers['cache-control']).toBe('private, no-store');
    for (const field of ['published', 'draft', 'announcements', 'events', 'media', 'users']) expect(r.body.data[field]).toBeTypeOf('number');
    expect(r.body.data.approvalEnabled).toBe(false);
    for (const secret of ['passwordHash', 'tokenHash', 'email', 'ipHash', 'requestId', 'permohonan']) expect(JSON.stringify(r.body.data)).not.toContain(secret);
  });
  it('paginates/searches users and does not leak hashes, tokens, phone or private metadata', async () => {
    const r = await admin.get(`/api/v1/admin/dashboard/users?limit=1&search=${encodeURIComponent(target.email)}`).expect(200);
    expect(r.body.data.total).toBe(1); expect(r.body.data.items[0].id).toBe(target.id);
    for (const field of ['passwordHash', 'refreshSessions', 'phone']) expect(JSON.stringify(r.body.data)).not.toContain(field);
    await admin.get('/api/v1/admin/dashboard/users?limit=100').expect(400);
    expect((await admin.get('/api/v1/admin/dashboard/users?search=no-match-xyz')).body.data.total).toBe(0);
  });
  it('requires CSRF/Origin, reauthentication, exact action fields and refuses self-change', async () => {
    await admin.post(accessPath()).send(await input('DEACTIVATE')).expect(403);
    await admin.post(accessPath()).set({ ...headers, Origin: 'https://evil.invalid' }).send(await input('DEACTIVATE')).expect(403);
    await admin.post(accessPath()).set(headers).send(await input('DEACTIVATE', { currentPassword: 'wrong' })).expect(403);
    await admin.post(accessPath()).set(headers).send(await input('DEACTIVATE', { role: 'ADMIN_KELURAHAN' })).expect(400);
    await admin.post(`/api/v1/admin/dashboard/users/${ids[0]}/access`).set(headers).send(await input('DEACTIVATE')).expect(409);
  });
  it('deactivates immediately, rejects existing access/refresh and audits context transactionally', async () => {
    const r = await admin.post(accessPath()).set(headers).send(await input('DEACTIVATE')).expect(200);
    expect(r.body.data.item.isActive).toBe(false);
    await citizen.get('/api/v1/auth/me').expect(401);
    const h = { Origin: 'http://localhost:3000', 'X-CSRF-Token': (await citizen.get('/api/v1/auth/csrf')).body.data.csrfToken };
    await citizen.post('/api/v1/auth/refresh').set(h).expect(401);
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { resourceId: target.id, action: 'USER_DEACTIVATE' } });
    expect(audit.actorId).toBe(ids[0]); expect(audit.requestId).toBe(r.body.requestId); expect(audit.ipHash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(audit)).not.toContain(password);
  });
  it('activates without reviving old sessions and resets passwords without returning secrets', async () => {
    await admin.post(accessPath()).set(headers).send(await input('ACTIVATE')).expect(200);
    const newPassword = randomUUID() + '-Bb2!';
    const r = await admin.post(accessPath()).set(headers).send(await input('RESET_PASSWORD', { newPassword })).expect(200);
    expect(JSON.stringify(r.body)).not.toContain(newPassword);
    const row = await prisma.user.findUniqueOrThrow({ where: { id: target.id } }); expect(await compare(newPassword, row.passwordHash)).toBe(true);
    expect(await compare(password, row.passwordHash)).toBe(false);
    await login(citizen, target.email, newPassword);
  });
  it('changes roles only after backend authorization and revokes sessions, with stale update protection', async () => {
    const body = await input('SET_ROLE', { role: 'LURAH' });
    const r = await admin.post(accessPath()).set(headers).send(body).expect(200);
    expect(r.body.data.item.role).toBe('LURAH'); await citizen.get('/api/v1/auth/me').expect(401);
    expect(await prisma.auditLog.count({ where: { resourceId: target.id, action: 'USER_SET_ROLE_LURAH' } })).toBe(1);
    await admin.post(accessPath()).set(headers).send(body).expect(409);
  });
  it('paginates audits and upload inventory while preserving private ownership', async () => {
    const media = await prisma.mediaAsset.create({ data: { id: randomUUID(), storageKey: `${randomUUID()}.pdf`, originalName: 'PRIVATE_DO_NOT_LEAK.pdf', mimeType: 'application/pdf', size: 50, visibility: 'PRIVATE', ownerId: ids[1], alt: '', caption: '' } });
    const r = await admin.get('/api/v1/admin/dashboard/uploads').expect(200);
    expect(JSON.stringify(r.body.data)).not.toContain(media.originalName); expect(r.body.data.quota.perFileBytes).toBe(20 * 1024 * 1024); expect(r.body.data.quota.totalLimitBytes).toBeNull();
    await admin.get(`/api/v1/admin/media/${media.id}/file`).expect(403); await request(server).get(`/api/v1/public/media/${media.id}`).expect(404);
    const audit = await admin.get('/api/v1/admin/dashboard/audit?search=USER_SET_ROLE&limit=1').expect(200);
    expect(audit.body.data.total).toBe(1); expect(audit.body.data.items[0].requestId).toBeTruthy();
    expect((await admin.get('/api/v1/admin/dashboard/audit?page=2&limit=1&search=USER_SET_ROLE')).body.data.items).toEqual([]);
  });
  it('revokes a refresh that races with password reset without leaving a new active session', async () => {
    const account = await prisma.user.create({ data: { email: `race-${randomUUID()}@example.invalid`, passwordHash: await hash(password, 12) } });
    ids.push(account.id); target = account;
    const racing = request.agent(server); const h = await login(racing, account.email);
    let unlock!: () => void; let locked!: () => void;
    const released = new Promise<void>(resolve => { unlock = resolve; });
    const acquired = new Promise<void>(resolve => { locked = resolve; });
    const holding = prisma.$transaction(async tx => { await lockAccount(tx, account.id); locked(); await released; }, { timeout: 15000 });
    await acquired;
    async function waitForLocks(count: number) {
      for (let i = 0; i < 150; i++) {
        const rows = await observer.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) AS count FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock'`;
        if (Number(rows[0].count) >= count) return;
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      throw Error('Concurrent requests did not reach the lock barrier');
    }
    try {
      const refresh = racing.post('/api/v1/auth/refresh').set(h).then(r => r);
      await waitForLocks(1);
      const reset = admin.post(accessPath()).set(headers).send(await input('RESET_PASSWORD', { newPassword: randomUUID() + '-New!' })).then(r => r);
      await waitForLocks(2); unlock(); await holding;
      expect((await refresh).status).toBe(200); expect((await reset).status).toBe(200);
      await racing.get('/api/v1/auth/me').expect(401);
      expect(await prisma.refreshSession.count({ where: { userId: account.id, revokedAt: null } })).toBe(0);
    } finally { unlock(); await holding; }
  }, 15000);

});
