import './db-safety.js';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { hash } from 'bcryptjs';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { readdir, rm } from 'node:fs/promises';
import { prisma } from '../lib/prisma.js';
import { createApp } from '../app.js';
import { MAX_FILE_SIZE, filePath } from '../modules/cms/media.js';
import { defaultSettings } from '../modules/profile.js';
const app = createApp();
const origin = 'http://localhost:3000';
const admin = request.agent(app); const secondAdmin = request.agent(app); const citizen = request.agent(app); const lurah = request.agent(app);
const users: string[] = []; const assets: string[] = [];
const categoryId = randomUUID(); const newsId = randomUUID(); const slug = `test-${randomUUID()}`;
let headers: Record<string,string>; let otherHeaders: Record<string,string>; let citizenHeaders: Record<string,string>; let lurahHeaders: Record<string,string>; let image: Buffer; let publicId: string; let privateId: string; let pdfId: string;
let version = 0;
const base = () => ({ slug, title: 'Berita Uji', excerpt: 'Ringkasan uji', bodyHtml: '<p>Isi awal</p>', categoryId, coverId: publicId, status: 'DRAFT', expectedVersion: version });
beforeAll(async () => {
  image = await sharp({ create: { width: 20, height: 20, channels: 3, background: '#123456' } }).png().toBuffer();
  for (const [agent, role] of [[admin, 'ADMIN_KELURAHAN'], [secondAdmin, 'ADMIN_KELURAHAN'], [citizen, 'MASYARAKAT'], [lurah, 'LURAH']] as const) {
    const email = `cms-${randomUUID()}@example.invalid`; const password = randomUUID()+'-Aa1!';
    const user = await prisma.user.create({ data: { email, role, passwordHash: await hash(password,12) } }); users.push(user.id);
    const csrf = (await agent.get('/api/v1/auth/csrf')).body.data.csrfToken;
    const h = { Origin: origin, 'X-CSRF-Token': csrf };
    await agent.post('/api/v1/auth/login').set(h).send({ email, password }).expect(200);
    if (agent === admin) headers = h; else if (agent === secondAdmin) otherHeaders = h; else if (agent === citizen) citizenHeaders = h; else lurahHeaders = h;
  }
}, 15000);
afterAll(async () => {
  await prisma.news.deleteMany({ where: { authorId: { in: users } } });
  await prisma.newsCategory.deleteMany({ where: { id: categoryId } });
  await prisma.siteSetting.deleteMany({ where: { id: 'site' } });
  const files = await prisma.mediaAsset.findMany({ where: { ownerId: { in: users } } });
  await prisma.mediaAsset.deleteMany({ where: { ownerId: { in: users } } });
  for (const file of files) await rm(filePath(file.storageKey), { force: true });
  await prisma.user.deleteMany({ where: { id: { in: users } } }); await prisma.$disconnect();
});
async function upload(visibility: string, name = 'office.png') {
  const response = await admin.post('/api/v1/admin/media').set(headers).field('visibility', visibility).field('alt', 'Kantor uji').field('caption', 'Dokumentasi uji').attach('file', image, { filename: name, contentType: 'image/png' }).expect(201);
  assets.push(response.body.data.asset.id); return response.body.data.asset;
}
describe('news and media integration PostgreSQL', () => {
  it('rejects anonymous, citizen and LURAH management or upload before processing files', async () => {
    for (const path of ['/api/v1/admin/news', '/api/v1/admin/media']) await request(app).get(path).expect(401);
    for (const [agent,h] of [[citizen,citizenHeaders], [lurah,lurahHeaders]] as const) {
      await agent.get('/api/v1/admin/news').expect(403);
      await agent.get(`/api/v1/admin/news/${newsId}/preview`).expect(403);
      await agent.put(`/api/v1/admin/news/${newsId}`).set(h).send(base()).expect(403);
      await agent.post('/api/v1/admin/media').set(h).attach('file', image, 'office.png').expect(403);
    }
    await admin.post('/api/v1/admin/media').attach('file', image, 'office.png').expect(403);
    await admin.put(`/api/v1/admin/news/categories/${categoryId}`).set({ ...headers, Origin: 'https://evil.invalid' }).send({ name: 'Denied', slug: 'denied', archived: false }).expect(403);
  });
  it('uploads verified public/private images and enforces private ownership including another admin', async () => {
    const publicAsset = await upload('PUBLIC'); publicId = publicAsset.id;
    const privateAsset = await upload('PRIVATE'); privateId = privateAsset.id;
    expect(privateAsset.url).toBeNull(); expect(publicAsset.url).toBe(`/api/v1/public/media/${publicId}`);
    expect(publicAsset).not.toHaveProperty('storageKey');
    const row = await prisma.mediaAsset.findUniqueOrThrow({ where: { id: publicId } }); expect(row.storageKey).toBe(`general/images/${publicId}.png`);
    await request(app).get(`/api/v1/public/media/${publicId}`).expect(200).expect('X-Content-Type-Options','nosniff');
    await request(app).get(`/api/v1/public/media/${privateId}`).expect(404);
    await request(app).get(`/api/v1/admin/media/${privateId}/file`).expect(401);
    await secondAdmin.get(`/api/v1/admin/media/${privateId}/file`).expect(403);
    await secondAdmin.patch(`/api/v1/admin/media/${privateId}`).set(otherHeaders).send({ alt: 'Denied', caption: '', archived: true }).expect(403);
    await admin.get(`/api/v1/admin/media/${privateId}/file`).expect(200);
    await secondAdmin.get('/api/v1/admin/media').then(r => expect(r.body.data.items.some((item: { id: string }) => item.id === privateId)).toBe(false));
  });
  it('decodes and re-encodes JPEG and WebP as well as PNG', async () => {
    for (const format of ['jpeg', 'webp'] as const) {
      const bytes = await sharp(image).toFormat(format).toBuffer();
      const response = await admin.post('/api/v1/admin/media').set(headers).field('visibility','PUBLIC').field('alt','Foto uji').field('caption','').attach('file', bytes, {filename:`photo.${format}`,contentType:`image/${format}`}).expect(201);
      expect(response.body.data.asset.mimeType).toBe(`image/${format}`);
    }
  });
  it('rejects disguised, malformed and oversized files, multiple files, empty alt and unsupported fields', async () => {
    const send = () => admin.post('/api/v1/admin/media').set(headers).field('visibility','PUBLIC').field('alt','Uji').field('caption','');
    await send().attach('file', Buffer.from('<script>alert(1)</script>'), { filename: 'fake.png', contentType: 'image/png' }).expect(400);
    await send().attach('file', image, { filename: 'wrong.pdf', contentType: 'application/pdf' }).expect(400);
    await send().attach('file', image.subarray(0,30), { filename: 'broken.png', contentType: 'image/png' }).expect(400);
    await send().attach('file', Buffer.from('%PDF-1.7\nNOT A DOCUMENT\n%%EOF'), { filename: 'fake.pdf', contentType: 'application/pdf' }).expect(400);
    await send().attach('file', Buffer.alloc(MAX_FILE_SIZE+1), { filename: 'large.png', contentType: 'image/png' }).expect(413);
    await send().attach('file', image, 'a.png').attach('file', image, 'b.png').expect(400);
    await admin.post('/api/v1/admin/media').set(headers).field('visibility','PUBLIC').field('alt','').field('caption','').attach('file', image,'a.png').expect(400);
    await send().field('ownerId',users[1]).attach('file', image,'a.png').expect(400);
  });
  it('accepts a valid 20 MB PDF and forces public downloads as sandboxed attachments', async () => {
    const pdf = await PDFDocument.create(); pdf.addPage(); const bytes = await pdf.save();
    const buffer = Buffer.alloc(MAX_FILE_SIZE, 32); Buffer.from(bytes).copy(buffer); Buffer.from('\n%%EOF\n').copy(buffer,MAX_FILE_SIZE-7);
    const result = await admin.post('/api/v1/admin/media').set(headers).field('visibility','PUBLIC').field('alt','').field('caption','Dokumen uji').attach('file',buffer,{filename:'document.pdf',contentType:'application/pdf'}).expect(201);
    pdfId = result.body.data.asset.id; assets.push(pdfId);
    await request(app).get(`/api/v1/public/media/${pdfId}`).expect(200).then(r => { expect(r.headers['content-disposition']).toContain('attachment'); expect(r.headers['content-security-policy']).toContain('sandbox'); });
    await admin.put('/api/v1/admin/profile/settings').set(headers).send({ ...defaultSettings, heroUrl: `/api/v1/public/media/${pdfId}` }).expect(400);
    const isolated = await upload('PUBLIC');
    await admin.put('/api/v1/admin/profile/settings').set(headers).send({ ...defaultSettings, heroUrl: `/api/v1/public/media/${isolated.id.toUpperCase()}` }).expect(200).then(r=>expect(r.body.data.settings.heroUrl).toBe(`/api/v1/public/media/${isolated.id}`));
    await admin.patch(`/api/v1/admin/media/${isolated.id}`).set(headers).send({alt:'Uji',caption:'',archived:true}).expect(409);
    await admin.put('/api/v1/admin/profile/settings').set(headers).send({ ...defaultSettings, heroUrl: `/api/v1/public/media/${publicId}` }).expect(200);
    await admin.patch(`/api/v1/admin/media/${isolated.id}`).set(headers).send({alt:'Uji',caption:'',archived:true}).expect(200);
  }, 20000);
  it('runs draft/edit/publish/archive and rollback, enforces stable slugs and optimistic versions', async () => {
    await admin.put(`/api/v1/admin/news/categories/${categoryId}`).set(headers).send({ name: 'Kegiatan Uji', slug: `category-${randomUUID()}`, archived: false }).expect(200);
    await admin.put(`/api/v1/admin/news/${newsId}`).set(headers).send(base()).expect(200).then(r => { version = r.body.data.news.version; expect(r.body.data.news.authorId).toBe(users[0]); });
    await request(app).get(`/api/v1/public/news/${slug}`).expect(404);
    await admin.get(`/api/v1/admin/news/${newsId}/preview`).expect(200);
    const first = (await admin.get(`/api/v1/admin/news/${newsId}/revisions`)).body.data.items[0];
    await admin.put(`/api/v1/admin/news/${newsId}`).set(headers).send({ ...base(), status: 'PUBLISHED', bodyHtml: `<h2>Kegiatan</h2><p onclick="evil()">Isi terbit<script>window.cmsXss=1</script></p><img src="/api/v1/public/media/${publicId}" alt="Kantor" onerror="evil()"><iframe src="https://evil.invalid"></iframe>` }).expect(200).then(r => { version = r.body.data.news.version; expect(r.body.data.news.publishedAt).toBeTruthy(); });
    await request(app).get(`/api/v1/public/news/${slug}`).expect(200).then(r => { expect(r.body.data.news.bodyHtml).not.toMatch(/script|onerror|onclick|iframe/); expect(r.body.data.news.bodyHtml).toContain('<h2>Kegiatan</h2>'); });
    await admin.put(`/api/v1/admin/news/${newsId}`).set(headers).send({ ...base(), slug: 'invalid slug' }).expect(400);
    await admin.put(`/api/v1/admin/news/${newsId}`).set(headers).send({ ...base(), expectedVersion: 0 }).expect(409);
    await admin.put(`/api/v1/admin/news/${newsId}`).set(headers).send({ ...base(), coverId: privateId }).expect(400);
    await admin.put(`/api/v1/admin/news/${newsId}`).set(headers).send({ ...base(), coverId: pdfId }).expect(400);
    await admin.put(`/api/v1/admin/news/${newsId}`).set(headers).send({ ...base(), status:'ARCHIVED' }).expect(200).then(r => version = r.body.data.news.version);
    await request(app).get(`/api/v1/public/news/${slug}`).expect(404);
    await admin.post(`/api/v1/admin/news/${newsId}/rollback`).set(headers).send({ revisionId:first.id, expectedVersion:version }).expect(200).then(r => { version = r.body.data.news.version; expect(r.body.data.news.status).toBe('DRAFT'); expect(r.body.data.news.bodyHtml).toBe('<p>Isi awal</p>'); });
    await request(app).get(`/api/v1/public/news/${slug}`).expect(404);
    expect(await prisma.newsRevision.count({ where: { newsId } })).toBe(4);
    await admin.post(`/api/v1/admin/news/${randomUUID()}/rollback`).set(headers).send({revisionId:first.id,expectedVersion:1}).expect(404);
    await admin.get('/api/v1/admin/news?limit=1&page=1&status=DRAFT&search=Berita&sort=title').expect(200).then(r => { expect(r.body.data.items.length).toBe(1); expect(r.body.data.total).toBeGreaterThanOrEqual(1); });
    await admin.get('/api/v1/admin/news?limit=1000').expect(400);
    await admin.get(`/api/v1/admin/news/${newsId}/revisions?limit=1&page=2`).expect(200).then(r => expect(r.body.data.items[0].version).toBe(3));
  });
  it('paginates and sorts filtered news on the server without mixing result pages', async () => {
    await prisma.news.createMany({ data: ['C','A','B'].map(title => ({ title: `Pagination ${title}`, slug: `pagination-${randomUUID()}`, excerpt:'Uji',bodyHtml:'<p>Uji</p>',authorId:users[0],categoryId,status:'DRAFT' as const })) });
    const first = await admin.get('/api/v1/admin/news?search=Pagination&sort=title&limit=2&page=1&status=DRAFT').expect(200);
    const second = await admin.get('/api/v1/admin/news?search=Pagination&sort=title&limit=2&page=2&status=DRAFT').expect(200);
    expect(first.body.data.total).toBe(3); expect(first.body.data.items.map((item: {title:string})=>item.title)).toEqual(['Pagination A','Pagination B']);
    expect(second.body.data.items.map((item: {title:string})=>item.title)).toEqual(['Pagination C']);
    await admin.get('/api/v1/admin/news?search=Pagination&status=PUBLISHED').then(r=>expect(r.body.data.total).toBe(0));
  });
  it('prevents archiving referenced media and preserves metadata, rejects inactive admins', async () => {
    await admin.patch(`/api/v1/admin/media/${publicId}`).set(headers).send({ alt:'Foto kantor',caption:'Keterangan baru',archived:false }).expect(200);
    await admin.patch(`/api/v1/admin/media/${publicId}`).set(headers).send({ alt:'Foto kantor',caption:'',archived:true }).expect(409);
    await admin.patch(`/api/v1/admin/media/${privateId}`).set(headers).send({ alt:'Privat',caption:'',archived:true }).expect(200);
    await admin.get(`/api/v1/admin/media/${privateId}/file`).expect(404);
    expect(await prisma.auditLog.count({ where: { actorId: users[0], action:'NEWS_ROLLED_BACK' } })).toBe(1);
    await prisma.user.update({ where: { id:users[0] }, data: { isActive:false } });
    await admin.get('/api/v1/admin/news').expect(403); await admin.post('/api/v1/admin/media').set(headers).attach('file', image,'a.png').expect(403);
    const { env } = await import('../config/env.js');
    expect(await readdir(`${env.UPLOAD_ROOT}/tmp`)).toEqual([]);
  });
});
