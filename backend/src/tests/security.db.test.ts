import './db-safety.js';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { hash } from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { createApp } from '../app.js';
const app = createApp();
const admin = request.agent(app);
let id: string;
let headers: Record<string, string>;
beforeAll(async () => {
  const email = `security-${randomUUID()}@example.invalid`;
  const password = randomUUID() + '-Aa1!';
  const user = await prisma.user.create({
    data: {
      email,
      role: 'ADMIN_KELURAHAN',
      passwordHash: await hash(password, 12),
    },
  });
  id = user.id;
  const csrfToken = (await admin.get('/api/v1/auth/csrf')).body.data.csrfToken;
  headers = { Origin: 'http://localhost:3000', 'X-CSRF-Token': csrfToken };
  await admin
    .post('/api/v1/auth/login')
    .set(headers)
    .send({ email, password })
    .expect(200);
});
afterAll(async () => {
  if (id) await prisma.user.delete({ where: { id } });
  await prisma.$disconnect();
});
describe('Prompt 13 OWASP API regressions', () => {
  it('treats SQL metacharacters as search data and rejects structured query injection', async () => {
    const before = await prisma.user.count();
    const payload = "'; DROP TABLE User; --";
    for (const path of [
      '/api/v1/admin/news',
      '/api/v1/admin/dashboard/users',
    ]) {
      const r = await admin.get(path).query({ search: payload }).expect(200);
      expect(r.body.data.items).toEqual([]);
    }
    await admin.get('/api/v1/admin/news?search=x&search=y').expect(400);
    await admin.get('/api/v1/admin/news?page=1%20OR%201=1').expect(400);
    expect(await prisma.user.count()).toBe(before);
  });
  it('rejects forged access tokens, auth query tokens and cross-site mutation', async () => {
    await request(app)
      .get('/api/v1/admin/news')
      .set(
        'Cookie',
        'kalosara_access=eyJhbGciOiJub25lIn0.eyJyb2xlIjoiTFVSQUgifQ.',
      )
      .expect(401);
    await request(app)
      .get('/api/v1/admin/news?role=ADMIN_KELURAHAN&access_token=forged')
      .expect(401);
    await admin
      .put(`/api/v1/admin/news/categories/${randomUUID()}`)
      .set({ ...headers, Origin: 'http://localhost:3000.attacker.invalid' })
      .send({})
      .expect(403);
    await admin
      .put(`/api/v1/admin/news/categories/${randomUUID()}`)
      .set({ Origin: headers.Origin, 'X-CSRF-Token': 'a'.repeat(43) })
      .send({})
      .expect(403);
  });
});
