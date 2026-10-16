import { describe, it, expect } from 'vitest';
import { settingSchema, defaultSettings, officialSchema, pageSchema } from '../modules/profile.js';
describe('profile validation', () => {
  it('rejects unsafe media, links, unpaired/out-of-range coordinates and extra privilege fields', () => {
    expect(settingSchema.safeParse(defaultSettings).success).toBe(true);
    for (const change of [{ logoUrl: 'javascript:alert(1)' }, { heroUrl: 'https://evil.invalid/a.svg' }, { latitude: 200, longitude: 1 }, { latitude: 1 }, { role: 'LURAH' }, { relatedLinks: [{ label: 'XSS', href: 'javascript:alert(1)' }] }]) {
      expect(settingSchema.safeParse({ ...defaultSettings, ...change }).success).toBe(false);
    }
  });
  it('validates publication lifecycle and term dates', () => {
    expect(pageSchema.safeParse({ title: 'Sejarah', content: '<script>alert(1)</script>', status: 'DRAFT' }).success).toBe(true); // Stored/rendered as plain text, never HTML.
    expect(pageSchema.safeParse({ title: 'x', content: '', status: 'PUBLIC' }).success).toBe(false);
    expect(officialSchema.safeParse({ name: 'Uji', position: 'Lurah', unit: 'Kelurahan', sortOrder: 0, photoUrl: null, active: true, termStart: '2026-10-16', termEnd: '2025-01-01', status: 'DRAFT' }).success).toBe(false);
  });
});
