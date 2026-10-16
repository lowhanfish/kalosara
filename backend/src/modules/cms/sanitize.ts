import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';
import { mediaUrlSchema, idSchema } from './common.js';
export function sanitizeBody(input: string): { html: string; mediaIds: string[] } {
  const mediaIds = new Set<string>();
  const html = sanitizeHtml(input, {
    allowedTags: ['p', 'br', 'h2', 'h3', 'strong', 'em', 's', 'blockquote', 'ul', 'ol', 'li', 'a', 'img'],
    allowedAttributes: { a: ['href', 'rel', 'target'], img: ['src', 'alt', 'title', 'loading'] },
    allowedSchemes: ['https', 'http', 'mailto', 'tel'], allowProtocolRelative: false,
    transformTags: {
      a: (_tag, attrs) => ({ tagName: 'a', attribs: { href: attrs.href ?? '', rel: 'noopener noreferrer nofollow', target: '_blank' } }),
      img: (_tag, attrs) => {
        const parsed = mediaUrlSchema.safeParse(attrs.src);
        if (parsed.success) mediaIds.add(parsed.data.split('/').at(-1)!);
        return { tagName: 'img', attribs: parsed.success ? { src: parsed.data, alt: (attrs.alt ?? '').slice(0,300), loading: 'lazy' } : {} as Record<string, string> };
      },
    },
    exclusiveFilter: frame => frame.tag === 'img' && !frame.attribs.src,
    enforceHtmlBoundary: true,
  });
  // Bound links too: sanitize-html handles encoding; enforce only explicit schemes, no relative/navigation tricks.
  const clean = sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'h2', 'h3', 'strong', 'em', 's', 'blockquote', 'ul', 'ol', 'li', 'a', 'img'],
    allowedAttributes: { a: ['href', 'rel', 'target'], img: ['src', 'alt', 'loading'] },
    allowedSchemes: ['https', 'http', 'mailto', 'tel'], allowProtocolRelative: false,
    transformTags: { a: (_tag, attrs) => ({ tagName: 'a', attribs: { ...attrs, href: /^(https?:\/\/|mailto:|tel:)/i.test(attrs.href ?? '') ? attrs.href : '' } }) },
  });
  return { html: clean, mediaIds: [...mediaIds] };
}
export const newsInput = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
  title: z.string().trim().min(1).max(200), excerpt: z.string().trim().max(1000), bodyHtml: z.string().max(60000),
  categoryId: idSchema, coverId: idSchema.nullable(), status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  expectedVersion: z.number().int().min(0),
}).strict();
