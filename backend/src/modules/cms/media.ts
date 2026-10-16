import { enqueueInvalidation, notifyInvalidation } from './cache-invalidation.js';
import { Router, type RequestHandler, type Response } from 'express';
import multer from 'multer';
import { mkdir, readFile, writeFile, rm, rename, stat } from 'node:fs/promises';
import { resolve, basename, extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileTypeFromFile } from 'file-type';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { authenticate, requireMutation } from '../auth/routes.js';
import { loadActivePrincipal, requireRoles, assertOwner } from '../auth/authorization.js';
import { CmsError, idSchema, pagination, transaction, mediaUrl } from './common.js';

export const MAX_FILE_SIZE = 20 * 1024 * 1024;
const root = resolve(env.UPLOAD_ROOT);
export const filePath = (key: string) => resolve(root, 'objects', basename(key));
const fields = z.object({ visibility: z.enum(['PUBLIC', 'PRIVATE']), alt: z.string().trim().max(300), caption: z.string().trim().max(1000) }).strict();
const select = { id: true, originalName: true, mimeType: true, size: true, alt: true, caption: true, visibility: true, archived: true, ownerId: true, createdAt: true } as const;
let processing = 0;
export const mediaAdminRouter = Router();
mediaAdminRouter.use(authenticate, loadActivePrincipal, requireRoles('ADMIN_KELURAHAN'));
mediaAdminRouter.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
mediaAdminRouter.get('/', async (req, res) => {
  const query = pagination.extend({ visibility: z.enum(['PUBLIC', 'PRIVATE']).optional() }).parse(req.query);
  const where = { archived: false, ...(query.visibility ? { visibility: query.visibility } : {}), AND: [{ OR: [{ visibility: 'PUBLIC' as const }, { ownerId: req.auth!.userId }] }], originalName: { contains: query.search, mode: 'insensitive' as const } };
  const [items, total] = await prisma.$transaction([prisma.mediaAsset.findMany({ where, select, take: query.limit, skip: (query.page - 1) * query.limit, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }] }), prisma.mediaAsset.count({ where })]);
  res.json({ success: true, data: { items: items.map(item => ({ ...item, url: item.visibility === 'PUBLIC' ? mediaUrl(item.id) : null })), total, page: query.page, limit: query.limit }, requestId: req.id });
});
const uploadLimit = rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, handler: (req, res) => res.status(429).json({ success: false, error: { code: 'UPLOAD_RATE_LIMITED', message: 'Too many uploads' }, requestId: req.id }) });
const uploadHandler: RequestHandler = async (req, res) => {
  if (processing >= 2) throw new CmsError(503, 'UPLOAD_BUSY', 'Upload capacity busy; try again');
  processing++;
  const temporary = resolve(root, 'tmp', randomUUID());
  let stored: string | undefined;
  let committed = false;
  const derivatives: string[] = [];
  try {
    await mkdir(temporary, { recursive: true, mode: 0o700 });
    await mkdir(resolve(root, 'objects'), { recursive: true, mode: 0o700 });
    const parser = multer({ dest: temporary, limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 3, fieldSize: 4000, parts: 4, headerPairs: 100 } }).single('file');
    await new Promise<void>((accept, reject) => {
      const abort = () => reject(new CmsError(400, 'UPLOAD_ABORTED', 'Upload interrupted'));
      req.once('aborted', abort);
      parser(req, res, error => { req.removeListener('aborted', abort); if (error) reject(error); else accept(); });
    });
    const input = fields.parse(req.body);
    const file = req.file;
    if (!file) throw new CmsError(400, 'FILE_REQUIRED', 'Choose one file');
    if (!file.size || file.size > MAX_FILE_SIZE) throw new CmsError(413, 'FILE_TOO_LARGE', 'Maximum 20 MB per file');
    const detected = await fileTypeFromFile(file.path);
    const supported: Record<string, string[]> = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'], 'application/pdf': ['.pdf'] };
    if (!detected || !supported[detected.mime]?.includes(extname(file.originalname).toLowerCase()) || file.mimetype !== detected.mime) throw new CmsError(400, 'INVALID_FILE_TYPE', 'Signature, MIME and extension must match JPG/PNG/WebP/PDF');
    if (detected.mime.startsWith('image/') && !input.alt) throw new CmsError(400, 'ALT_REQUIRED', 'Image alt text is required');
    const id = randomUUID(); const storageKey = `${id}.${detected.ext}`;
    stored = filePath(storageKey);
    let size = file.size;
    if (detected.mime === 'application/pdf') {
      try {
        const buffer = await readFile(file.path);
        if (!buffer.subarray(0,8).toString().startsWith('%PDF-') || !buffer.subarray(-1024).toString().includes('%%EOF')) throw new Error('Invalid PDF');
        const pdf = await PDFDocument.load(buffer, { ignoreEncryption: false, throwOnInvalidObject: true, updateMetadata: false });
        if (pdf.getPageCount() < 1 || pdf.getPageCount() > 1000) throw new Error('Invalid page count');
      } catch { throw new CmsError(400, 'INVALID_PDF', 'PDF must be valid, unencrypted and contain 1–1000 pages'); }
      await rename(file.path, stored);
    } else {
      try {
        const image = sharp(file.path, { limitInputPixels: 25_000_000, animated: false, failOn: 'warning' }).rotate();
        const buffer = await (detected.mime === 'image/jpeg' ? image.jpeg({ quality: 85 }) : detected.mime === 'image/png' ? image.png() : image.webp({ quality: 85 })).toBuffer();
        size = buffer.length;
        if (size > MAX_FILE_SIZE) throw new Error('Oversized image');
        await writeFile(stored, buffer, { flag: 'wx', mode: 0o600 });
        if (input.visibility === 'PUBLIC') {
          for (const [variant, width] of [['thumb', 480], ['display', 1200]] as const) {
            const target = filePath(`${id}-${variant}.webp`); derivatives.push(target);
            const optimized = await sharp(buffer).resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
            await writeFile(target, optimized, { flag: 'wx', mode: 0o600 });
          }
        }
      } catch { throw new CmsError(400, 'INVALID_IMAGE', 'Image cannot be decoded safely (maximum 25 megapixels)'); }
    }
    const asset = await transaction(async tx => {
      const result = await tx.mediaAsset.create({ data: { id, storageKey, mimeType: detected.mime, size, originalName: Array.from(basename(file.originalname)).filter(char => char.charCodeAt(0) > 31 && char.charCodeAt(0) !== 127).join('').slice(0,200), ownerId: req.auth!.userId, ...input }, select });
      await tx.auditLog.create({ data: { actorId: req.auth!.userId, action: 'MEDIA_UPLOADED', resourceType: 'MediaAsset', resourceId: id } });
      return result;
    });
    committed = true;
    res.status(201).json({ success: true, data: { asset: { ...asset, url: asset.visibility === 'PUBLIC' ? mediaUrl(asset.id) : null } }, requestId: req.id });
  } catch (error) {
    if (error instanceof multer.MulterError) throw new CmsError(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400, error.code, 'One file, maximum 20 MB; only visibility, alt and caption fields allowed');
    throw error;
  } finally {
    processing--;
    await rm(temporary, { recursive: true, force: true });
    if (stored && !committed) await rm(stored, { force: true });
    if (!committed) await Promise.all(derivatives.map(path => rm(path, { force: true })));
  }
};
mediaAdminRouter.post('/', requireMutation, uploadLimit, uploadHandler);
mediaAdminRouter.patch('/:id', requireMutation, async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const input = fields.pick({ alt: true, caption: true }).extend({ archived: z.boolean() }).strict().parse(req.body);
  const asset = await transaction(async tx => {
    const current = await tx.mediaAsset.findUnique({ where: { id } });
    if (!current) throw new CmsError(404, 'NOT_FOUND', 'Media not found');
    if (current.visibility === 'PRIVATE') assertOwner(res.locals.principal, current.ownerId);
    if (current.mimeType.startsWith('image/') && !input.alt) throw new CmsError(400, 'ALT_REQUIRED', 'Image alt text is required');
    if (input.archived) {
      const [news, revisions, settings, officials] = await Promise.all([
        tx.newsMedia.count({ where: { mediaId: id } }), tx.newsRevision.count({ where: { mediaIds: { has: id } } }),
        tx.siteSetting.findUnique({ where: { id: 'site' } }), tx.official.count({ where: { photoUrl: mediaUrl(id) } }),
      ]);
      if (news || revisions || officials || JSON.stringify(settings?.value ?? {}).includes(mediaUrl(id))) throw new CmsError(409, 'MEDIA_IN_USE', 'Media is referenced by content or revision; keep it available');
    }
    const result = await tx.mediaAsset.update({ where: { id }, data: input, select });
    await tx.auditLog.create({ data: { actorId: req.auth!.userId, action: 'MEDIA_UPDATED', resourceType: 'MediaAsset', resourceId: id } });
    const event = await enqueueInvalidation(tx);
    return { result, event };
  });
  res.json({ success: true, data: { asset: asset.result, cacheInvalidated: await notifyInvalidation(asset.event.id) }, requestId: req.id });
});
function serveFile(res: Response, asset: { storageKey: string; mimeType: string; size: number; id: string }) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  res.setHeader('Cache-Control', 'no-store');
  res.type(asset.mimeType);
  res.setHeader('Content-Disposition', `${asset.mimeType === 'application/pdf' ? 'attachment' : 'inline'}; filename="${asset.id}.${extname(asset.storageKey).slice(1)}"`);
  res.sendFile(filePath(asset.storageKey), error => { if (error && !res.headersSent) res.status(404).end(); });
}
mediaAdminRouter.get('/:id/file', async (req, res) => {
  const asset = await prisma.mediaAsset.findFirst({ where: { id: idSchema.parse(req.params.id), archived: false } });
  if (!asset) throw new CmsError(404, 'NOT_FOUND', 'Media not found');
  if (asset.visibility === 'PRIVATE') assertOwner(res.locals.principal, asset.ownerId);
  serveFile(res, asset);
});
export const publicMediaRouter = Router();
publicMediaRouter.get('/:id', async (req, res) => {
  const asset = await prisma.mediaAsset.findFirst({ where: { id: idSchema.parse(req.params.id), archived: false, visibility: 'PUBLIC' } });
  if (!asset) throw new CmsError(404, 'NOT_FOUND', 'Media not found');
  const variant = z.enum(['thumb', 'display']).optional().parse(req.query.variant);
  if (variant && asset.mimeType.startsWith('image/')) {
    const key = `${asset.id}-${variant}.webp`;
    try { await stat(filePath(key)); serveFile(res, { ...asset, storageKey: key, mimeType: 'image/webp' }); return; }
    catch { /* Older uploads remain readable using the already compressed original. */ }
  }
  serveFile(res, asset);
});
