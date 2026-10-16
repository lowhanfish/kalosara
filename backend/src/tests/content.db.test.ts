import './db-safety.js';
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import { hash } from 'bcryptjs';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { stat } from 'node:fs/promises';
import { prisma } from '../lib/prisma.js';
import { createApp } from '../app.js';
import { filePath, MAX_FILE_SIZE } from '../modules/cms/media.js';
const url = new URL(process.env.DATABASE_URL!);
if (!['127.0.0.1', 'localhost'].includes(url.hostname) || !url.pathname.endsWith('_test')) throw new Error('Disposable local test database required');
const app = createApp(); const admin = request.agent(app); const other = request.agent(app); const citizen = request.agent(app); const lurah = request.agent(app);
const users: string[] = []; const items: string[] = []; let h: Record<string, string>; let otherH: Record<string, string>; let privatePdf: string; let publicPdf: string; let imageId: string;
const announcement = (extra = {}) => ({ kind: 'announcements', title: 'Pengumuman uji', content: '<script>literal</script>', status: 'DRAFT', expectedVersion: 0, pinned: false, startsAt: null, expiredAt: null, ...extra });
async function put(kind: string, body: object, status = 200) { const id = randomUUID(); items.push(id); return admin.put(`/api/v1/admin/content/${kind}/${id}`).set(h).send(body).expect(status); }
beforeAll(async () => {
  for (const [agent, role] of [[admin, 'ADMIN_KELURAHAN'], [other, 'ADMIN_KELURAHAN'], [citizen, 'MASYARAKAT'], [lurah, 'LURAH']] as const) {
    const email = `content-${randomUUID()}@example.invalid`; const password = randomUUID() + '-Aa1!';
    const user = await prisma.user.create({ data: { email, role, passwordHash: await hash(password, 12) } }); users.push(user.id);
    const csrfToken = (await agent.get('/api/v1/auth/csrf')).body.data.csrfToken; const headers = { Origin: 'http://localhost:3000', 'X-CSRF-Token': csrfToken };
    await agent.post('/api/v1/auth/login').set(headers).send({ email, password }).expect(200);
    if (agent === admin) h = headers; if (agent === other) otherH = headers;
  }
}, 20000);
afterAll(async () => {
  await prisma.contentItem.deleteMany({ where: { id: { in: items } } });
  await prisma.mediaAsset.deleteMany({ where: { ownerId: { in: users } } });
  await prisma.user.deleteMany({ where: { id: { in: users } } }); await prisma.$disconnect();
});
describe('Prompt 09 PostgreSQL acceptance', () => {
  it('enforces all channel permissions, inactive users, Origin and CSRF', async () => {
    for (const kind of ['announcements', 'events', 'galleries', 'documents']) {
      const path = `/api/v1/admin/content/${kind}`;
      await request(app).get(path).expect(401);
      for (const agent of [citizen, lurah]) { await agent.get(path).expect(403); await agent.put(`${path}/${randomUUID()}`).set(h).send({}).expect(403); }
      await admin.put(`${path}/${randomUUID()}`).send({}).expect(403);
      await admin.put(`${path}/${randomUUID()}`).set({ ...h, Origin: 'https://evil.invalid' }).send({}).expect(403);
    }
    await prisma.user.update({ where: { id: users[1] }, data: { isActive: false } }); await other.get('/api/v1/admin/content/announcements').expect(403);
    await prisma.user.update({ where: { id: users[1] }, data: { isActive: true } });
  });
  it('filters draft, archived, expired, future; pins and paginates active announcements; detects conflicts', async () => {
    for (const extra of [{}, { status: 'ARCHIVED' }, { status: 'PUBLISHED', expiredAt: '2020-01-01T00:00:00Z' }, { status: 'PUBLISHED', startsAt: '2099-01-01T00:00:00Z' }]) await put('announcements', announcement(extra));
    const published = await put('announcements', announcement({ title: 'Prioritas', status: 'PUBLISHED', pinned: true })); const id = published.body.data.item.id;
    await put('announcements', announcement({ status: 'PUBLISHED' }));
    const first = await request(app).get('/api/v1/public/content/announcements?limit=1').expect(200);
    expect(first.body.data.total).toBe(2); expect(first.body.data.items[0].id).toBe(id); expect(first.headers['cache-control']).toBe('no-store');
    const second = await request(app).get('/api/v1/public/content/announcements?limit=1&page=2').expect(200); expect(second.body.data.items[0].id).not.toBe(id);
    await admin.put(`/api/v1/admin/content/announcements/${id}`).set(h).send(announcement()).expect(409);
    await admin.put(`/api/v1/admin/content/announcements/${id}`).set(h).send(announcement({ status: 'ARCHIVED', expectedVersion: 1 })).expect(200);
    expect((await request(app).get('/api/v1/public/content/announcements')).body.data.total).toBe(1);
    await admin.get('/api/v1/admin/content/announcements?status=DRAFT&search=Pengumuman&limit=1').expect(200).then(r => expect(r.body.data.total).toBe(1));
    await request(app).get('/api/v1/public/content/announcements?limit=100').expect(400);
    await request(app).get(`/api/v1/public/content/announcements/${id}`).expect(404);
    expect(await prisma.auditLog.count({ where: { resourceId: id, action: 'CONTENT_SAVED' } })).toBe(2);
    expect(await prisma.cacheInvalidation.count({ where: { tags: { has: 'public-content' } } })).toBeGreaterThan(0);
  });
  it('hides expired announcements immediately without a background job or warm cache', async () => {
    const r = await put('announcements', announcement({ status: 'PUBLISHED', title: 'Boundary' })); const id = r.body.data.item.id;
    expect((await request(app).get('/api/v1/public/content/announcements?search=Boundary')).body.data.total).toBe(1);
    await prisma.announcement.update({ where: { contentId: id }, data: { expiredAt: new Date(Date.now() - 1) } });
    expect((await request(app).get('/api/v1/public/content/announcements?search=Boundary')).body.data.total).toBe(0);
  });
  it('publishes events as ordered lists with upcoming/past filters and validates dates', async () => {
    const base = { kind: 'events', title: 'Agenda uji', content: '', status: 'PUBLISHED', expectedVersion: 0, location: 'Tempat uji' };
    await put('events', { ...base, start: '2020-01-01T00:00:00Z', end: '2020-01-02T00:00:00Z' });
    await put('events', { ...base, start: '2099-01-01T00:00:00Z', end: '2099-01-02T00:00:00Z' });
    await put('events', { ...base, status: 'DRAFT', start: '2099-01-01T00:00:00Z', end: '2099-01-02T00:00:00Z' });
    await put('events', { ...base, start: '2099-01-01T00:00:00Z', end: '2020-01-02T00:00:00Z' }, 400);
    for (const period of ['past', 'upcoming']) await request(app).get(`/api/v1/public/content/events?period=${period}`).expect(200).then(r => expect(r.body.data.total).toBe(1));
  });
  it('uploads exactly 20 MiB PUBLIC/PRIVATE PDFs to disk, denies oversize, disguise, traversal and private reads', async () => {
    const pdf = await PDFDocument.create(); pdf.addPage(); const bytes = await pdf.save();
    const buffer = Buffer.alloc(MAX_FILE_SIZE, 32); Buffer.from(bytes).copy(buffer); Buffer.from('\n%%EOF\n').copy(buffer, MAX_FILE_SIZE - 7);
    const upload = (visibility: string, source = 'documents', payload = buffer) => admin.post('/api/v1/admin/media').set(h).field('source', source).field('visibility', visibility).field('alt', '').field('caption', '').attach('file', payload, { filename: 'test.pdf', contentType: 'application/pdf' });
    publicPdf = (await upload('PUBLIC').expect(201)).body.data.asset.id; privatePdf = (await upload('PRIVATE').expect(201)).body.data.asset.id;
    for (const id of [publicPdf, privatePdf]) { const row = await prisma.mediaAsset.findUniqueOrThrow({ where: { id } }); expect(row.storageKey).toBe(`documents/documents/${id}.pdf`); expect((await stat(filePath(row.storageKey))).size).toBe(MAX_FILE_SIZE); }
    await request(app).get(`/api/v1/public/media/${publicPdf}`).expect(200).then(r => expect(r.headers['content-disposition']).toContain('attachment'));
    await request(app).get(`/api/v1/public/media/${privatePdf}`).expect(404); await other.get(`/api/v1/admin/media/${privatePdf}/file`).expect(403); await admin.get(`/api/v1/admin/media/${privatePdf}/file`).expect(200);
    await request(app).get(`/uploads/documents/documents/${privatePdf}.pdf`).expect(404); await request(app).get(`/public/uploads/documents/documents/${privatePdf}.pdf`).expect(404);
    await upload('PUBLIC', '../documents').expect(400); await upload('PUBLIC', 'documents', Buffer.alloc(MAX_FILE_SIZE + 1)).expect(413); await upload('PUBLIC', 'documents', Buffer.from('fake pdf')).expect(400);
  }, 30000);
  it('publishes approved documents only; private PDF stays a draft with owner checks', async () => {
    const base = { kind: 'documents', title: 'Standar pelayanan uji', content: '', category: 'Standar pelayanan', fileId: privatePdf, status: 'DRAFT', expectedVersion: 0 };
    await put('documents', base); await put('documents', { ...base, status: 'PUBLISHED' }, 400);
    await other.put(`/api/v1/admin/content/documents/${randomUUID()}`).set(otherH).send(base).expect(400);
    await put('documents', { ...base, fileId: publicPdf, status: 'PUBLISHED' });
    await request(app).get('/api/v1/public/content/documents?category=Standar%20pelayanan').expect(200).then(r => { expect(r.body.data.total).toBe(1); expect(r.body.data.items[0].document.fileId).toBe(publicPdf); });
    await admin.patch(`/api/v1/admin/media/${publicPdf}`).set(h).send({ alt: '', caption: '', archived: true }).expect(409);
  });
  it('publishes albums with public images, alt, thumbnails and bounded photo count; protects references', async () => {
    const bytes = await sharp({ create: { width: 900, height: 600, channels: 3, background: '#123456' } }).png().toBuffer();
    const asset = (await admin.post('/api/v1/admin/media').set(h).field('source', 'galleries').field('visibility', 'PUBLIC').field('alt', 'Foto uji').field('caption', '').attach('file', bytes, { filename: 'test.png', contentType: 'image/png' }).expect(201)).body.data.asset;
    imageId = asset.id; const base = { kind: 'galleries', title: 'Album uji', content: '', status: 'PUBLISHED', expectedVersion: 0, photos: [{ mediaId: imageId, alt: 'Foto album uji' }] };
    await put('galleries', base); await put('galleries', { ...base, status: 'DRAFT' });
    await put('galleries', { ...base, photos: [{ mediaId: privatePdf, alt: 'Uji' }] }, 400); await put('galleries', { ...base, photos: Array(13).fill(base.photos[0]) }, 400);
    const thumb = await request(app).get(`/api/v1/public/media/${imageId}?variant=thumb`).expect(200); expect((await sharp(thumb.body).metadata()).width).toBe(480);
    await request(app).get('/api/v1/public/content/galleries?limit=1').expect(200).then(r => { expect(r.body.data.total).toBe(1); expect(r.body.data.items[0].gallery.photos[0].alt).toBe('Foto album uji'); });
    await admin.patch(`/api/v1/admin/media/${imageId}`).set(h).send({ alt: 'Uji', caption: '', archived: true }).expect(409);
    await admin.put(`/api/v1/admin/content/events/${items.at(-1)}`).set(h).send({ ...base, kind: 'events', start: '2099-01-01T00:00:00Z', end: '2099-01-02T00:00:00Z', location: 'Uji' }).expect(400);
  });
});
