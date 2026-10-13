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
