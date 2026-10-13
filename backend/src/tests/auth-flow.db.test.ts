import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { decodeJwt } from 'jose';
import { createApp } from '../app.js';
import { authCookieOptions, CSRF_COOKIE, REFRESH_COOKIE } from '../modules/auth/cookies.js';
import { tokenHash } from '../modules/auth/tokens.js';

const db = new PrismaClient();
const app = createApp();
const origin = 'http://localhost:3000';
const password = 'Test-only-password-123';
const email = `auth-${randomUUID()}@example.invalid`;
let userId: string | undefined;
afterAll(async () => {
  if (userId) await db.user.delete({ where: { id: userId } });
  await db.$disconnect();
});

function cookie(response: request.Response, name: string): string {
  const values = response.headers['set-cookie'] as unknown as string[] | undefined;
  const found = values?.find((value) => value.startsWith(`${name}=`));
  if (!found) throw new Error(`Missing ${name} cookie`);
  return found.split(';')[0];
}

describe('authentication API with PostgreSQL', () => {
  it('runs register, login, me, refresh, logout and enforces Origin/CSRF', async () => {
    const agent = request.agent(app);
    const csrfResponse = await agent.get('/api/v1/auth/csrf').expect(200);
    const csrf = csrfResponse.body.data.csrfToken as string;
    expect(cookie(csrfResponse, CSRF_COOKIE)).toContain(csrf);

    await agent.post('/api/v1/auth/login').send({ email, password }).expect(403).then((r) => {
      expect(r.body.error.code).toBe('ORIGIN_FORBIDDEN');
    });
    await agent.post('/api/v1/auth/login').set('Origin', origin).send({ email, password }).expect(403).then((r) => {
      expect(r.body.error.code).toBe('CSRF_INVALID');
    });

    const mutate = () => ({ Origin: origin, 'X-CSRF-Token': csrf });
    const registered = await agent.post('/api/v1/auth/register').set(mutate())
      .send({ email, password, displayName: 'Warga Uji', role: 'LURAH' }).expect(201);
    userId = registered.body.data.user.id;
    expect(registered.body.data.user.role).toBe('MASYARAKAT');
    expect(JSON.stringify(registered.body)).not.toContain('passwordHash');
    expect((await db.user.findUniqueOrThrow({ where: { id: userId } })).role).toBe('MASYARAKAT');

    await agent.post('/api/v1/auth/login').set(mutate()).send({ email, password: 'incorrect' }).expect(401)
      .then((r) => expect(r.body.error.code).toBe('UNAUTHENTICATED'));
    const signedIn = await agent.post('/api/v1/auth/login').set(mutate()).send({ email, password }).expect(200);
    expect(JSON.stringify(signedIn.body)).not.toContain('kalosara_access');
    const accessCookie = cookie(signedIn, 'kalosara_access');
    const oldRefreshCookie = cookie(signedIn, REFRESH_COOKIE);
    const cookieHeaders = signedIn.headers['set-cookie'] as unknown as string[];
    expect(cookieHeaders.every((header) => header.includes('HttpOnly') && header.includes('SameSite=Strict'))).toBe(true);
    const refreshHeader = cookieHeaders.find((header) => header.startsWith(`${REFRESH_COOKIE}=`));
    expect(refreshHeader).toContain('Path=/api/v1/auth');
    const maxAge = Number(refreshHeader?.match(/Max-Age=(\d+)/)?.[1]);
    expect(maxAge).toBeGreaterThanOrEqual(604790);
    expect(maxAge).toBeLessThanOrEqual(604800);
    const payload = decodeJwt(accessCookie.split('=')[1]);
    expect(payload.exp! - payload.iat!).toBe(900);

    const me = await agent.get('/api/v1/auth/me').expect(200);
    expect(me.body.data.user).toMatchObject({ email, role: 'MASYARAKAT', profile: { displayName: 'Warga Uji' } });
    const refreshed = await agent.post('/api/v1/auth/refresh').set(mutate()).expect(200);
    expect(cookie(refreshed, REFRESH_COOKIE)).not.toBe(oldRefreshCookie);
    await agent.get('/api/v1/auth/me').expect(200);
    await request(app).post('/api/v1/auth/refresh').set(mutate())
      .set('Cookie', `${oldRefreshCookie}; ${CSRF_COOKIE}=${csrf}`).expect(409)
      .then((r) => expect(r.body.error.code).toBe('REFRESH_RACE'));

    await agent.post('/api/v1/auth/logout').set(mutate()).expect(200);
    await agent.get('/api/v1/auth/me').expect(401);
    await agent.post('/api/v1/auth/refresh').set(mutate()).expect(401);
  });

  it('revokes every session on logout-all and rejects inactive accounts', async () => {
    const first = request.agent(app);
    const second = request.agent(app);
    const firstCsrf = (await first.get('/api/v1/auth/csrf').expect(200)).body.data.csrfToken as string;
    const secondCsrf = (await second.get('/api/v1/auth/csrf').expect(200)).body.data.csrfToken as string;
    await first.post('/api/v1/auth/login').set({ Origin: origin, 'X-CSRF-Token': firstCsrf }).send({ email, password }).expect(200);
    await second.post('/api/v1/auth/login').set({ Origin: origin, 'X-CSRF-Token': secondCsrf }).send({ email, password }).expect(200);
    await db.user.update({ where: { id: userId! }, data: { isActive: false } });
    await first.get('/api/v1/auth/me').expect(403).then((r) => expect(r.body.error.code).toBe('ACCOUNT_INACTIVE'));
    await db.user.update({ where: { id: userId! }, data: { isActive: true } });
    await first.post('/api/v1/auth/logout-all').set({ Origin: origin, 'X-CSRF-Token': firstCsrf }).expect(200);
    await second.get('/api/v1/auth/me').expect(401).then((r) => expect(r.body.error.code).toBe('SESSION_REVOKED'));

    const third = request.agent(app);
    const thirdCsrf = (await third.get('/api/v1/auth/csrf')).body.data.csrfToken as string;
    const mutation = { Origin: origin, 'X-CSRF-Token': thirdCsrf };
    const thirdLogin = await third.post('/api/v1/auth/login').set(mutation).send({ email, password }).expect(200);
    const oldCookie = cookie(thirdLogin, REFRESH_COOKIE);
    const oldHash = tokenHash(oldCookie.split('=')[1]);
    const oldSession = await db.refreshSession.findUniqueOrThrow({ where: { tokenHash: oldHash } });
    const thirdRefresh = await third.post('/api/v1/auth/refresh').set(mutation).expect(200);
    const newHash = tokenHash(cookie(thirdRefresh, REFRESH_COOKIE).split('=')[1]);
    const newSession = await db.refreshSession.findUniqueOrThrow({ where: { tokenHash: newHash } });
    expect(newSession.expiresAt.getTime()).toBe(oldSession.expiresAt.getTime());
    await db.refreshSession.update({ where: { id: oldSession.id }, data: { rotatedAt: new Date(Date.now() - 10_000) } });
    await request(app).post('/api/v1/auth/refresh').set(mutation)
      .set('Cookie', `${oldCookie}; ${CSRF_COOKIE}=${thirdCsrf}`).expect(401)
      .then((r) => expect(r.body.error.code).toBe('SESSION_REVOKED'));
    await third.get('/api/v1/auth/me').expect(401).then((r) => expect(r.body.error.code).toBe('SESSION_REVOKED'));
  });

  it('limits repeated login attempts and reserves a non-enumerating reset response', async () => {
    const agent = request.agent(app);
    const csrf = (await agent.get('/api/v1/auth/csrf')).body.data.csrfToken as string;
    const headers = { Origin: origin, 'X-CSRF-Token': csrf };
    let limited = false;
    for (let i = 0; i < 12; i++) {
      const response = await agent.post('/api/v1/auth/login').set(headers).send({ email, password: 'wrong' });
      if (response.status === 429) {
        expect(response.body.error.code).toBe('RATE_LIMITED');
        limited = true;
        break;
      }
      expect(response.status).toBe(401);
    }
    expect(limited).toBe(true);
    const reset = await agent.post('/api/v1/auth/forgot-password').set(headers).send({ email }).expect(503);
    const unknown = await agent.post('/api/v1/auth/forgot-password').set(headers)
      .send({ email: 'unknown@example.invalid' }).expect(503);
    expect(reset.body.error).toEqual(unknown.body.error);
  });

  it('sets Secure cookies for HTTPS origins', () => {
    expect(authCookieOptions('/api/v1', true, 'https://example.invalid')).toMatchObject({
      secure: true, httpOnly: true, sameSite: 'strict', path: '/api/v1',
    });
  });
});
