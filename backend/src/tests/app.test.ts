import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('API foundation', () => {
  const app = createApp();

  it('returns a structured health response and request id', async () => {
    const response = await request(app).get('/api/v1/health').expect(200);
    expect(response.body).toMatchObject({ success: true, data: { status: 'ok' } });
    expect(response.body.requestId).toBe(response.headers['x-request-id']);
  });

  it('returns a structured 404', async () => {
    const response = await request(app).get('/api/v1/unknown').expect(404);
    expect(response.body).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
  });
});


describe('Prompt 13 security boundary', () => {
  const app = createApp();
  it('applies Helmet on success, auth errors and parser errors without enabling CORS', async () => {
    for (const path of ['/api/v1/health', '/api/v1/account/profile', '/missing']) {
      const r = await request(app).get(path).set('Origin', 'https://attacker.invalid');
      expect(r.headers['x-content-type-options']).toBe('nosniff');
      expect(r.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(r.headers['content-security-policy']).toContain("default-src 'self'");
      expect(r.headers['access-control-allow-origin']).toBeUndefined();
      expect(r.headers['x-powered-by']).toBeUndefined();
    }
    const malformed = await request(app).post('/api/v1/auth/login').set('Content-Type', 'application/json').send('{"secret":');
    expect(malformed.status).toBe(400);
    expect(malformed.headers['cache-control']).toBe('private, no-store');
    expect(malformed.body.error.code).toBe('INVALID_JSON');
    expect(JSON.stringify(malformed.body)).not.toContain('secret');
  });
  it('caps JSON and isolates auth responses including anonymous failures', async () => {
    const r = await request(app).post('/api/v1/auth/login').send({ value: 'a'.repeat(103000) });
    expect(r.status).toBe(413);
    expect(r.body.error.code).toBe('BODY_TOO_LARGE');
    for (const path of ['/api/v1/auth/me', '/api/v1/admin/news', '/api/v1/account/profile']) {
      const denied = await request(app).get(path).expect(401);
      expect(denied.headers['cache-control']).toContain('no-store');
    }
    expect(app.get('trust proxy')).toBe(false);
  });
  it('does not accept client request IDs and exposes only uptime on health', async () => {
    const r = await request(app).get('/api/v1/health').set('X-Request-Id', 'injected').expect(200);
    expect(r.body.requestId).not.toBe('injected');
    expect(r.body.data.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(Object.keys(r.body.data).sort()).toEqual(['status', 'uptimeSeconds']);
  });
  it('cannot bypass brute-force limits with spoofed forwarding headers', async () => {
    let r;
    for (let i = 0; i < 11; i++) r = await request(app).post('/api/v1/auth/login').set('X-Forwarded-For', `198.51.100.${i + 1}`).send({});
    expect(r!.status).toBe(429);
    expect(r!.body.error.code).toBe('RATE_LIMITED');
  });
});
