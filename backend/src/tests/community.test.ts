import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
const db = vi.hoisted(() => ({
  appSetting: { findUnique: vi.fn(), upsert: vi.fn() },
  refreshSession: { findUnique: vi.fn() }, user: { findUnique: vi.fn() },
  cacheInvalidation: { create: vi.fn(), findUnique: vi.fn() },
  publicRequest: { create: vi.fn(), findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
  auditLog: { create: vi.fn() },
  facility: { findFirst: vi.fn() }, potential: { findFirst: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock('../lib/prisma.js', () => ({ prisma: db }));
import { createApp } from '../app.js';
import { signAccessToken } from '../services/auth.service.js';
import { requestInput, requestUpdate, sectionInput } from '../validators/community.validator.js';
import { contentInput } from '../validators/cms.validator.js';
const payload = { kind: 'COMPLAINT', name: 'Pengirim Uji', email: 'uji@example.invalid', phone: '', organization: '', subject: 'Layanan lingkungan', message: 'Pesan uji yang hanya berada di penyimpanan tiruan.', consent: true };
const section = { title: 'Anggaran', content: '', period: '', source: '', status: 'DRAFT', version: 0, metrics: [{ label: 'Belanja', value: null, unit: 'Rp' }] };
beforeEach(() => { vi.clearAllMocks(); db.$transaction.mockImplementation(async fn => Array.isArray(fn) ? Promise.all(fn) : fn(db)); });
describe('community input boundaries', () => {
  it('requires consent, follow-up contact, bounded message and rejects privilege/identity fields', () => {
    expect(requestInput.safeParse(payload).success).toBe(true);
    for (const extra of [{ consent: false }, { email: '', phone: '' }, { kind: 'OTHER' }, { message: 'short' }, { message: 'a'.repeat(5001) }, { status: 'RESOLVED' }, { nik: 'forbidden' }, { email: 'not-email' }]) expect(requestInput.safeParse({ ...payload, ...extra }).success).toBe(false);
    expect(requestUpdate.safeParse({ status: 'RESOLVED', internalNote: '', expectedVersion: 1 }).success).toBe(true);
    expect(requestUpdate.safeParse({ status: 'RESOLVED', internalNote: '', expectedVersion: 0 }).success).toBe(false);
  });
  it('distinguishes missing aggregate from zero and requires attribution for publication', () => {
    expect(sectionInput.parse(section).metrics[0].value).toBeNull();
    expect(sectionInput.safeParse({ ...section, status: 'PUBLISHED' }).success).toBe(false);
    expect(sectionInput.safeParse({ ...section, status: 'PUBLISHED', period: '2026', source: 'Laporan resmi', metrics: [{ label: 'Belanja', value: 0, unit: 'Rp' }] }).success).toBe(true);
    expect(sectionInput.safeParse({ ...section, metrics: [{ label: 'Belanja', value: -1, unit: 'Rp' }] }).success).toBe(false);
    expect(sectionInput.safeParse({ ...section, metrics: [{ label: 'Belanja', value: 1.5, unit: 'Rp' }] }).success).toBe(false);
  });
  it('accepts explicit PPID classifications without accepting invented classifications', () => {
    const document = { title: 'Dokumen', content: '', status: 'DRAFT', expectedVersion: 0, kind: 'documents', category: 'Peraturan', fileId: 'b6bd6fc0-50dd-4b06-80b8-b74eb855997e' };
    expect(contentInput.safeParse(document).success).toBe(true);
    expect(contentInput.safeParse({ ...document, classification: 'BERKALA' }).success).toBe(true);
    expect(contentInput.safeParse({ ...document, classification: 'SECRET' }).success).toBe(false);
  });
});
describe('community HTTP boundaries with isolated fake storage', () => {
  const app = createApp();
  it('never exposes draft or archived section data; published data is explicitly projected', async () => {
    db.appSetting.findUnique.mockResolvedValue({ value: { ...section, status: 'DRAFT' } });
    expect((await request(app).get('/api/v1/public/community/sections/anggaran').expect(200)).body.data.section).toBeNull();
    db.appSetting.findUnique.mockResolvedValue({ value: { ...section, status: 'ARCHIVED' } });
    expect((await request(app).get('/api/v1/public/community/sections/anggaran').expect(200)).body.data.section).toBeNull();
    const published = { ...section, status: 'PUBLISHED', period: '2026', source: 'Laporan', content: 'Keterangan terverifikasi' };
    db.appSetting.findUnique.mockResolvedValue({ value: published });
    const r = await request(app).get('/api/v1/public/community/sections/anggaran').expect(200);
    expect(r.body.data.section.title).toBe('Anggaran');
    expect(r.headers['cache-control']).toBe('no-store');
    await request(app).get('/api/v1/public/community/sections/arbitrary-key').expect(400);
  });
  it('requires authenticated admin for inbox, details and section writes; no public inbox route', async () => {
    for (const path of ['/api/v1/admin/community/requests', '/api/v1/admin/community/requests/b6bd6fc0-50dd-4b06-80b8-b74eb855997e', '/api/v1/admin/community/sections/anggaran']) {
      const r = await request(app).get(path).expect(401); expect(r.headers['cache-control']).toContain('no-store');
    }
    await request(app).get('/api/v1/public/community/requests').expect(404);
  });
  it('denies citizen and inactive principals while allowing admin & lurah inbox without leaking bodies in listings', async () => {
    const userId = 'b6bd6fc0-50dd-4b06-80b8-b74eb855997e';
    const expiresAt = new Date(Date.now() + 600000);
    db.refreshSession.findUnique.mockResolvedValue({ userId, expiresAt, revokedAt: null });
    const token = await signAccessToken(userId, 'f6bd6fc0-50dd-4b06-80b8-b74eb855997e', expiresAt);
    const cookie = `kalosara_access=${token}`;
    for (const role of ['MASYARAKAT']) {
      db.user.findUnique.mockResolvedValue({ id: userId, role, isActive: true });
      await request(app).get('/api/v1/admin/community/requests').set('Cookie', cookie).expect(403);
    }
    db.user.findUnique.mockResolvedValue({ id: userId, role: 'ADMIN_KELURAHAN', isActive: false });
    await request(app).get('/api/v1/admin/community/requests').set('Cookie', cookie).expect(403);
    for (const role of ['ADMIN_KELURAHAN', 'LURAH']) {
      db.user.findUnique.mockResolvedValue({ id: userId, role, isActive: true });
      db.publicRequest.findMany.mockResolvedValue([]); db.publicRequest.count.mockResolvedValue(0);
      await request(app).get('/api/v1/admin/community/requests').set('Cookie', cookie).expect(200);
    }
    const projection = db.publicRequest.findMany.mock.calls[0][0].select;
    expect(projection.name).toBeUndefined(); expect(projection.email).toBeUndefined(); expect(projection.message).toBeUndefined();
  });
  it('rejects stale edits and persists follow-up with an optimistic version and audit', async () => {
    const userId = 'b6bd6fc0-50dd-4b06-80b8-b74eb855997e'; const expiresAt = new Date(Date.now() + 600000);
    db.refreshSession.findUnique.mockResolvedValue({ userId, expiresAt, revokedAt: null });
    db.user.findUnique.mockResolvedValue({ id: userId, role: 'ADMIN_KELURAHAN', isActive: true });
    const token = await signAccessToken(userId, 'f6bd6fc0-50dd-4b06-80b8-b74eb855997e', expiresAt);
    const agent = request.agent(app); const csrf = (await agent.get('/api/v1/auth/csrf')).body.data.csrfToken;
    const headers = { Origin: 'http://localhost:3000', 'X-CSRF-Token': csrf, Cookie: `kalosara_access=${token}; kalosara_csrf=${csrf}` };
    const path = '/api/v1/admin/community/requests/b6bd6fc0-50dd-4b06-80b8-b74eb855997e';
    db.publicRequest.updateMany.mockResolvedValue({ count: 0 });
    await agent.patch(path).set(headers).send({ status: 'RESOLVED', internalNote: 'Ditinjau', expectedVersion: 1 }).expect(409);
    expect(db.auditLog.create).not.toHaveBeenCalled();
    db.publicRequest.updateMany.mockResolvedValue({ count: 1 });
    const r = await agent.patch(path).set(headers).send({ status: 'RESOLVED', internalNote: 'Ditinjau', expectedVersion: 2 }).expect(200);
    expect(r.body.data.version).toBe(3); expect(db.publicRequest.updateMany.mock.calls[1][0].where.version).toBe(2);
    expect(db.auditLog.create).toHaveBeenCalledTimes(1);
  });
  it('rejects stale section versions and requires explicit publication metadata', async () => {
    const userId = 'b6bd6fc0-50dd-4b06-80b8-b74eb855997e'; const expiresAt = new Date(Date.now() + 600000);
    db.refreshSession.findUnique.mockResolvedValue({ userId, expiresAt, revokedAt: null });
    db.user.findUnique.mockResolvedValue({ id: userId, role: 'ADMIN_KELURAHAN', isActive: true });
    const token = await signAccessToken(userId, 'f6bd6fc0-50dd-4b06-80b8-b74eb855997e', expiresAt);
    const agent = request.agent(app); const csrf = (await agent.get('/api/v1/auth/csrf')).body.data.csrfToken;
    const headers = { Origin: 'http://localhost:3000', 'X-CSRF-Token': csrf, Cookie: `kalosara_access=${token}; kalosara_csrf=${csrf}` };
    db.appSetting.findUnique.mockResolvedValue({ value: { ...section, version: 2 } });
    await agent.put('/api/v1/admin/community/sections/anggaran').set(headers).send(section).expect(409);
    expect(db.appSetting.upsert).not.toHaveBeenCalled();
    await agent.put('/api/v1/admin/community/sections/anggaran').set(headers).send({ ...section, version: 2, status: 'PUBLISHED' }).expect(400);
    db.cacheInvalidation.create.mockResolvedValue({ id: userId }); db.cacheInvalidation.findUnique.mockResolvedValue({ deliveredAt: new Date() });
    await agent.put('/api/v1/admin/community/sections/anggaran').set(headers).send({ ...section, version: 2 }).expect(200);
    expect(db.appSetting.upsert.mock.calls[0][0].update.value.version).toBe(3);
  });
  it('keeps unknown places unavailable and sanitizes full detail descriptions', async () => {
    db.potential.findFirst.mockResolvedValue(null);
    const path = '/api/v1/public/region/potentials/b6bd6fc0-50dd-4b06-80b8-b74eb855997e';
    await request(app).get(path).expect(404);
    db.potential.findFirst.mockResolvedValue({ id: 'b6bd6fc0-50dd-4b06-80b8-b74eb855997e', name: 'Wisata', description: '<p>Isi aman</p><img src="https://evil.invalid/a.jpg" onerror="alert(1)"><script>alert(1)</script>' });
    const r = await request(app).get(path).expect(200);
    expect(r.body.data.item.description).toBe('<p>Isi aman</p>');
    const where = db.potential.findFirst.mock.calls[0][0].where;
    expect(where.status).toBe('PUBLISHED'); expect(where.OR[1].photo.visibility).toBe('PUBLIC');
  });
  it('persists both form kinds transactionally, returns receipt only, enforces CSRF/origin/rate limit', async () => {
    const agent = request.agent(app); const csrf = (await agent.get('/api/v1/auth/csrf')).body.data.csrfToken;
    const h = { Origin: 'http://localhost:3000', 'X-CSRF-Token': csrf };
    for (const kind of ['COMPLAINT', 'INFORMATION']) {
      const r = await agent.post('/api/v1/public/community/requests').set(h).send({ ...payload, kind }).expect(201);
      expect(Object.keys(r.body.data)).toEqual(['reference']); expect(r.body.data.reference).toMatch(/^[a-f0-9-]{36}$/);
      expect(r.headers['cache-control']).toBe('private, no-store');
      expect(JSON.stringify(r.body)).not.toContain(payload.email);
    }
    expect(db.publicRequest.create).toHaveBeenCalledTimes(2); expect(db.auditLog.create).toHaveBeenCalledTimes(2);
    await agent.post('/api/v1/public/community/requests').set({ Origin: 'http://localhost:3000' }).send(payload).expect(403);
    await agent.post('/api/v1/public/community/requests').set(h).send({ ...payload, consent: false }).expect(400);
    await agent.post('/api/v1/public/community/requests').set({ ...h, Origin: 'https://evil.invalid' }).send(payload).expect(403);
    await agent.post('/api/v1/public/community/requests').set(h).send(payload).expect(429);
    expect(db.publicRequest.create).toHaveBeenCalledTimes(2);
  });
});
