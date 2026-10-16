import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const publicUrl = z.string().max(500).refine(value => {
  if ((value.includes("\\") || Array.from(value).some(char => char.charCodeAt(0) <= 32))) return false;
  if (/^\/(?!\/)/.test(value)) return true;
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
});
const text = z.string().trim().min(1).max(300);
const fields = {
  'site.name': text,
  'site.address': text,
  'site.phone': z.string().regex(/^\+?[\d ()-]{6,30}$/),
  'site.email': z.email(),
  'site.hours': text,
  'site.logoUrl': publicUrl,
  'site.relatedLinks': z.array(z.object({ label: text, href: publicUrl })).max(10),
  'site.isExample': z.boolean(),
};

// Only explicitly public settings may leave this endpoint. Never spread arbitrary DB values.
export function projectPublicSettings(rows: { key: string; value: unknown }[]) {
  const data = new Map(rows.map(row => [row.key, row.value]));
  function read<K extends keyof typeof fields>(key: K) {
    const parsed = fields[key].safeParse(data.get(key));
    return parsed.success ? parsed.data : null;
  }
  const configuredName = read('site.name');
  const name = typeof configuredName === 'string' && configuredName !== 'Kelurahan Contoh' ? configuredName : 'Kelurahan Watundehoa';
  return {
    name,
    address: read('site.address') ?? (name === 'Kelurahan Watundehoa' ? 'Kelurahan Watundehoa, Kecamatan Puriala, Kabupaten Konawe' : null), phone: read('site.phone'), email: read('site.email'),
    hours: read('site.hours'), logoUrl: read('site.logoUrl'),
    relatedLinks: read('site.relatedLinks') ?? [], isExample: read('site.isExample') ?? (name !== 'Kelurahan Watundehoa'),
  };
}

export const publicSettingsRouter = Router();
publicSettingsRouter.get('/', async (req, res) => {
  const rows = await prisma.appSetting.findMany({ where: { key: { in: Object.keys(fields) } }, select: { key: true, value: true } });
  res.json({ success: true, data: { settings: projectPublicSettings(rows) }, requestId: req.id });
});
