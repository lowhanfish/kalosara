import { describe, expect, it } from 'vitest';
import { sanitizeBody } from '../modules/cms/sanitize.js';
import { mediaUrlSchema } from '../modules/cms/common.js';
import { filePath, storageKey, variantKey } from '../modules/cms/storage.js';
describe('disk media storage', () => {
  const id = '9cad3488-0dab-4b40-9537-f177765fe067';
  it('groups files by validated origin/type and keeps derivatives beside originals', () => {
    const key = storageKey('news', id, 'png', true);
    expect(key).toBe(`news/images/${id}.png`);
    expect(filePath(key)).toContain(`/news/images/${id}.png`);
    expect(variantKey(key, 'thumb')).toBe(`news/images/${id}-thumb.webp`);
    expect(storageKey('profile', id, 'pdf', false)).toBe(`profile/documents/${id}.pdf`);
    expect(filePath(`${id}.png`)).toContain(`/legacy/${id}.png`);
  });
  it.each(['../../secret.env', '/etc/passwd', 'news/../../secret.env', 'bad/images/file.png'])('rejects unsafe storage keys %s', key => {
    expect(() => filePath(key)).toThrow('Invalid media storage key');
  });
});
describe('news HTML safety', () => {
  it('retains only supported editor formatting and internal media IDs', () => {
    const id = '9cad3488-0dab-4b40-9537-f177765fe067';
    const output = sanitizeBody(`<h2>Heading</h2><p><strong>Bold</strong> <em>Italic</em></p><blockquote>Quote</blockquote><ul><li>List</li></ul><img src="/api/v1/public/media/${id}" alt="Office" onerror="alert(1)">`);
    expect(output.html).toContain('<strong>Bold</strong>'); expect(output.html).toContain('<blockquote>');
    expect(output.html).not.toContain('onerror'); expect(output.mediaIds).toEqual([id]);
  });
  it.each([
    '<script>alert(1)</script><iframe src="https://evil.invalid"></iframe>',
    '<a href="java&#x73;cript:alert(1)">bad</a><img src="data:image/svg+xml;base64,abc">',
    '<svg><animate attributeName="href" values="https://good.invalid;javascript:alert(1)"></animate></svg>',
    '<textarea><style></textarea/><img src=x onerror=alert(1)>',
    '<math><mtext><table><mglyph><style><!--</style><img title="--><img src=x onerror=alert(1)>">',
    '<img src="//evil.invalid/a.jpg"><img src="https://evil.invalid/a.jpg"><p style="background:url(javascript:alert(1))">x</p>',
    '<a href="//evil.invalid">protocol relative</a><a href="/admin">relative</a>',
  ])('strips active markup and unsafe URLs: %s', input => {
    const { html } = sanitizeBody(input);
    expect(html).not.toMatch(/<\/?(?:script|iframe|svg|animate|math|style|textarea)\b|onerror\s*=|javascript:|data:image|src="(?:https?:)?\/\/|href="\/\//i);
  });
  it('enforces exact media URL shape and stable sanitized HTML', () => {
    expect(mediaUrlSchema.safeParse('/api/v1/public/media/../../etc/passwd').success).toBe(false);
    expect(mediaUrlSchema.parse('/api/v1/public/media/9CAD3488-0DAB-4B40-9537-F177765FE067')).toBe('/api/v1/public/media/9cad3488-0dab-4b40-9537-f177765fe067');
    const first = sanitizeBody('<a href="https://example.invalid">Safe</a><p>Hello</p>');
    expect(sanitizeBody(first.html).html).toBe(first.html);
  });
});
