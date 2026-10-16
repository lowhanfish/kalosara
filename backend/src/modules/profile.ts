import { enqueueInvalidation, notifyInvalidation } from './cms/cache-invalidation.js';
import { mediaUrlSchema, assertPublicImages, transaction } from './cms/common.js';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireMutation } from './auth/routes.js';
import { loadActivePrincipal, requireRoles } from './auth/authorization.js';

const text = z.string().trim().min(1).max(300);
// Reviewed static assets and database-validated public image uploads.
export const media = z.union([mediaUrlSchema, z.enum(['/images/watundehoa/amirulah.webp', '/images/watundehoa/kantor.webp', '/images/watundehoa/papan-kantor.webp', '/images/reference/crest.webp', '/images/watundehoa/konawe.png'])]);
const httpsUrl = z.url().max(500).refine(v => new URL(v).protocol === 'https:');
export const settingSchema = z.object({
  name: text, district: text, regency: text, address: text.nullable(),
  phone: z.string().regex(/^\+?[\d ()-]{6,30}$/).nullable(), email: z.email().nullable(), hours: text.nullable(),
  latitude: z.number().min(-90).max(90).nullable(), longitude: z.number().min(-180).max(180).nullable(),
  logoUrl: media.nullable(), heroUrl: media.nullable(),
  relatedLinks: z.array(z.object({ label: text, href: httpsUrl }).strict()).max(10),
}).strict().refine(v => (v.latitude === null) === (v.longitude === null), 'Coordinates must be paired');
export const pageSlug = z.enum(['sejarah', 'visi-misi', 'tugas-fungsi', 'struktur-organisasi', 'sambutan-lurah']);
export const pageSchema = z.object({ title: z.string().trim().min(1).max(160), content: z.string().trim().max(30000), status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']) }).strict();
export const officialSchema = z.object({
  name: z.string().trim().min(1).max(160), position: z.string().trim().min(1).max(160), unit: z.string().trim().min(1).max(160),
  sortOrder: z.number().int().min(0).max(10000), photoUrl: media.nullable(), active: z.boolean(),
  termStart: z.iso.date().nullable(), termEnd: z.iso.date().nullable(), status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
}).strict().refine(v => !v.termStart || !v.termEnd || v.termStart <= v.termEnd, 'Invalid term');
export const defaultSettings = {
  name: 'Kelurahan Watundehoa', district: 'Kecamatan Puriala', regency: 'Kabupaten Konawe',
  address: 'Kelurahan Watundehoa, Kecamatan Puriala, Kabupaten Konawe', phone: null, email: null, hours: null,
  latitude: null, longitude: null, logoUrl: null, heroUrl: null, relatedLinks: [],
};
export async function readSettings() {
  const row = await prisma.siteSetting.findUnique({ where: { id: 'site' } });
  const parsed = settingSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : null;
}
export const publicProfileRouter = Router();
publicProfileRouter.get('/', async (req, res) => {
  const [pages, officials] = await Promise.all([
    prisma.page.findMany({ where: { status: 'PUBLISHED' }, orderBy: { slug: 'asc' } }),
    prisma.official.findMany({ where: { status: 'PUBLISHED', active: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }),
  ]);
  res.json({ success: true, data: { pages, officials }, requestId: req.id });
});
export const profileAdminRouter = Router();
profileAdminRouter.use(authenticate, loadActivePrincipal, requireRoles('ADMIN_KELURAHAN'));
profileAdminRouter.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
profileAdminRouter.get('/', async (req, res) => {
  const [settings, pages, officials] = await Promise.all([readSettings(), prisma.page.findMany({ orderBy: { slug: 'asc' } }), prisma.official.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] })]);
  res.json({ success: true, data: { settings: settings ?? defaultSettings, pages, officials }, requestId: req.id });
});
profileAdminRouter.put('/settings', requireMutation, async (req, res) => {
  const value = settingSchema.parse(req.body);
  const event = await transaction(async tx => {
    await assertPublicImages([value.logoUrl, value.heroUrl], tx);
    await tx.siteSetting.upsert({ where: { id: 'site' }, create: { id: 'site', value }, update: { value } });
    await tx.auditLog.create({ data: { actorId: req.auth!.userId, action: 'PROFILE_SETTINGS_UPDATED', resourceType: 'SiteSetting', resourceId: 'site' } });
    return enqueueInvalidation(tx, ['site-settings']);
  });
  await notifyInvalidation(event.id);
  res.json({ success: true, data: { settings: value }, requestId: req.id });
});
profileAdminRouter.put('/pages/:slug', requireMutation, async (req, res) => {
  const slug = pageSlug.parse(req.params.slug); const value = pageSchema.parse(req.body);
  const page = await transaction(async tx => {
    const result = await tx.page.upsert({ where: { slug }, create: { slug, ...value }, update: value });
    await tx.auditLog.create({ data: { actorId: req.auth!.userId, action: 'PROFILE_PAGE_SAVED', resourceType: 'Page', resourceId: slug } });
    return { result, event: await enqueueInvalidation(tx, ['public-profile']) };
  });
  await notifyInvalidation(page.event.id);
  res.json({ success: true, data: { page: page.result }, requestId: req.id });
});
profileAdminRouter.put('/officials/:id', requireMutation, async (req, res) => {
  const id = z.uuid().parse(req.params.id); const parsed = officialSchema.parse(req.body);
  const value = { ...parsed, termStart: parsed.termStart ? new Date(parsed.termStart) : null, termEnd: parsed.termEnd ? new Date(parsed.termEnd) : null };
  const official = await transaction(async tx => {
    await assertPublicImages([value.photoUrl], tx);
    const result = await tx.official.upsert({ where: { id }, create: { id, ...value }, update: value });
    await tx.auditLog.create({ data: { actorId: req.auth!.userId, action: 'PROFILE_OFFICIAL_SAVED', resourceType: 'Official', resourceId: id } });
    return { result, event: await enqueueInvalidation(tx, ['public-profile']) };
  });
  await notifyInvalidation(official.event.id);
  res.json({ success: true, data: { official: official.result }, requestId: req.id });
});
