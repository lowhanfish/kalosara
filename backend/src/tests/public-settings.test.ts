import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { projectPublicSettings } from '../modules/public-settings.js';

describe('public site identity', () => {
  it('projects only validated public fields, rejecting unsafe links and secrets', () => {
    const settings = projectPublicSettings([
      { key: 'site.name', value: 'Kelurahan Uji' },
      { key: 'auth.secret', value: 'private' },
      { key: 'site.logoUrl', value: 'javascript:alert(1)' },
      { key: 'site.relatedLinks', value: [{ label: 'Unsafe', href: '//evil.invalid' }] },
      { key: 'site.phone', value: 'not-a-phone' },
    ]);
    expect(settings).toMatchObject({ name: 'Kelurahan Uji', logoUrl: null, phone: null, relatedLinks: [], isExample: true });
    expect(JSON.stringify(settings)).not.toContain('private');
  });
  it('serves the DB identity in the standard envelope', async () => {
    const settingSpy = vi.spyOn(prisma.siteSetting, 'findUnique').mockResolvedValue(null);
    const spy = vi.spyOn(prisma.appSetting, 'findMany').mockResolvedValue([
      { key: 'site.name', value: 'Kelurahan Uji', createdAt: new Date(), updatedAt: new Date() },
    ]);
    try {
      const response = await request(createApp()).get('/api/v1/public/settings').expect(200);
      expect(response.body.data.settings.name).toBe('Kelurahan Uji');
      expect(response.body.requestId).toBe(response.headers['x-request-id']);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ where: { key: { in: expect.not.arrayContaining(['auth.secret']) } } }));
    } finally { spy.mockRestore(); settingSpy.mockRestore(); }
  });
});
