import { describe, it, expect } from 'vitest';
import { contentInput } from '../modules/cms/content.js';
import { filePath, storageKey } from '../modules/cms/storage.js';
const common = { title: 'Uji', content: '', status: 'DRAFT', expectedVersion: 0 };
describe('content validation', () => {
  it('validates lifecycle, channel-specific fields, intervals, alt and limits', () => {
    const a = { ...common, kind: 'announcements', pinned: false, startsAt: null, expiredAt: null };
    expect(contentInput.safeParse(a).success).toBe(true);
    for (const data of [{ ...a, status: 'PUBLIC' }, { ...a, ownerId: 'forged' }, { ...a, startsAt: '2026-10-20T00:00:00Z', expiredAt: '2026-10-19T00:00:00Z' }, { ...common, kind: 'events', start: '2026-10-20T00:00:00Z', end: '2026-10-19T00:00:00Z', location: 'Uji' }, { ...common, kind: 'galleries', photos: [] }, { ...common, kind: 'galleries', photos: [{ mediaId: 'b6bd6fc0-50dd-4b06-80b8-b74eb855997e', alt: '' }] }]) expect(contentInput.safeParse(data).success).toBe(false);
  });
  it('accepts channel storage keys while rejecting traversal and retaining legacy', () => {
    const id = 'b6bd6fc0-50dd-4b06-80b8-b74eb855997e';
    for (const source of ['announcements', 'events', 'galleries', 'documents'] as const) expect(filePath(storageKey(source, id, 'pdf', false))).toContain(`${source}/documents/${id}.pdf`);
    expect(filePath(`${id}.pdf`)).toContain(`/legacy/${id}.pdf`);
    expect(() => filePath(`documents/../../${id}.pdf`)).toThrow();
  });
});
