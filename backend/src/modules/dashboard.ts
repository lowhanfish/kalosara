import { lockAccount } from './auth/account-lock.js';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { readdir, lstat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { authenticate, requireMutation } from './auth/routes.js';
import { assertRole, loadActivePrincipal, requireRoles, AccessError } from './auth/authorization.js';
import { verifyPassword, hashPassword } from './auth/password.js';
import { passwordSchema } from './auth/validation.js';
import { idSchema, pagination } from './cms/common.js';

const router = Router();
router.use(authenticate, loadActivePrincipal, requireRoles('ADMIN_KELURAHAN', 'LURAH'));
router.use((_req, res, next) => { res.setHeader('Cache-Control', 'private, no-store'); next(); });
router.get('/', async (req, res) => {
  const [published, draft, announcements, events, media, users, activity] = await prisma.$transaction([
    prisma.news.count({ where: { status: 'PUBLISHED' } }), prisma.news.count({ where: { status: 'DRAFT' } }),
    prisma.contentItem.count({ where: { kind: 'announcements' } }), prisma.contentItem.count({ where: { kind: 'events' } }),
    prisma.mediaAsset.count(), prisma.user.count(),
    prisma.auditLog.findMany({ where: { resourceType: { notIn: ['User', 'AccountProfile', 'ContactChange'] } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 10,
      select: { id: true, action: true, resourceType: true, resourceId: true, createdAt: true } }),
  ]);
  res.json({ success: true, data: { published, draft, announcements, events, media, users, activity, approvalEnabled: false }, requestId: req.id });
});
router.use(requireRoles('ADMIN_KELURAHAN'));
const userSelect = { id: true, email: true, role: true, isActive: true, updatedAt: true, createdAt: true } as const;
router.get('/users', async (req, res) => {
  const { page, limit, search } = pagination.parse(req.query);
  const where = { email: { contains: search, mode: 'insensitive' as const } };
  const [items, total] = await prisma.$transaction([prisma.user.findMany({ where, select: userSelect, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * limit, take: limit }), prisma.user.count({ where })]);
  res.json({ success: true, data: { items, total, page, limit }, requestId: req.id });
});
const accessSchema = z.object({
  action: z.enum(['ACTIVATE', 'DEACTIVATE', 'REVOKE_SESSIONS', 'RESET_PASSWORD', 'SET_ROLE']),
  currentPassword: z.string().min(1).max(72), expectedUpdatedAt: z.iso.datetime(),
  identityVerified: z.literal(true), newPassword: passwordSchema.optional(),
  role: z.enum(['MASYARAKAT', 'LURAH', 'ADMIN_KELURAHAN']).optional(),
}).strict().superRefine((v, ctx) => {
  if ((v.action === 'RESET_PASSWORD') !== !!v.newPassword || (v.action === 'SET_ROLE') !== !!v.role)
    ctx.addIssue({ code: 'custom', message: 'Action fields do not match' });
});
router.post('/users/:id/access', requireMutation, rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, handler: (req, res) => { res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Terlalu banyak percobaan perubahan akses' }, requestId: req.id }); } }), async (req, res) => {
  const id = idSchema.parse(req.params.id); const input = accessSchema.parse(req.body);
  const actorId = req.auth!.userId;
  const actor = await prisma.user.findUniqueOrThrow({ where: { id: actorId } });
  if (!await verifyPassword(input.currentPassword, actor.passwordHash)) throw new AccessError(403, 'REAUTH_REQUIRED', 'Kata sandi admin tidak sesuai');
  if (id === actorId) throw new AccessError(409, 'SELF_ACCESS_CHANGE', 'Gunakan admin lain untuk perubahan akses akun sendiri');
  const passwordHash = input.newPassword ? await hashPassword(input.newPassword) : undefined;
  const item = await prisma.$transaction(async tx => {
    // Serialize administrative access changes, including last-active-admin checks.
    await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(1195461711)`;
    await lockAccount(tx, id);
    const currentActor = await tx.user.findUnique({ where: { id: actorId } });
    assertRole(currentActor, ['ADMIN_KELURAHAN']);
    if (currentActor!.passwordHash !== actor.passwordHash) throw new AccessError(409, 'CONFLICT', 'Sesi berubah; masuk kembali');
    const target = await tx.user.findUnique({ where: { id } });
    if (!target || target.updatedAt.toISOString() !== input.expectedUpdatedAt) throw new AccessError(409, 'CONFLICT', 'Muat ulang daftar pengguna');
    if (target.role === 'ADMIN_KELURAHAN' && target.isActive && (input.action === 'DEACTIVATE' || (input.action === 'SET_ROLE' && input.role !== 'ADMIN_KELURAHAN')) && await tx.user.count({ where: { role: 'ADMIN_KELURAHAN', isActive: true } }) <= 1)
      throw new AccessError(409, 'LAST_ADMIN', 'Admin aktif terakhir harus dipertahankan');
    const updated = await tx.user.update({ where: { id }, data: {
      ...(input.action === 'ACTIVATE' ? { isActive: true } : {}), ...(input.action === 'DEACTIVATE' ? { isActive: false } : {}),
      ...(input.action === 'SET_ROLE' ? { role: input.role } : {}), ...(passwordHash ? { passwordHash } : {}), updatedAt: new Date(),
    }, select: userSelect });
    await tx.refreshSession.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    await tx.passwordResetToken.updateMany({ where: { userId: id, usedAt: null }, data: { usedAt: new Date() } });
    if (['RESET_PASSWORD', 'DEACTIVATE', 'SET_ROLE'].includes(input.action)) await tx.contactChange.deleteMany({ where: { userId: id } });
    await tx.auditLog.create({ data: { actorId, action: `USER_${input.action}${input.role ? `_${input.role}` : ''}`, resourceType: 'User', resourceId: id } });
    return updated;
  }, { isolationLevel: 'ReadCommitted' });
  res.json({ success: true, data: { item }, requestId: req.id });
});
router.get('/audit', async (req, res) => {
  const { page, limit, search } = pagination.parse(req.query);
  const where = { action: { contains: search, mode: 'insensitive' as const } };
  const [items, total] = await prisma.$transaction([prisma.auditLog.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: limit, skip: (page - 1) * limit,
    select: { id: true, actorId: true, action: true, resourceType: true, resourceId: true, requestId: true, ipHash: true, createdAt: true } }), prisma.auditLog.count({ where })]);
  res.json({ success: true, data: { items, total, page, limit }, requestId: req.id });
});
// Physical bytes include optimized variants and legacy files; never follow symlinks.
async function diskBytes(directory: string): Promise<number> {
  let entries; try { entries = await readdir(directory, { withFileTypes: true }); } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 0; throw error; }
  let bytes = 0;
  for (const entry of entries) { const path = join(directory, entry.name); if (entry.isDirectory()) bytes += await diskBytes(path); else if (entry.isFile()) bytes += (await lstat(path)).size; }
  return bytes;
}
router.get('/uploads', async (req, res) => {
  const { page, limit, search } = pagination.parse(req.query);
  // Private files and names remain owner-scoped, even between admins.
  const where = { OR: [{ visibility: 'PUBLIC' as const }, { ownerId: req.auth!.userId }], originalName: { contains: search, mode: 'insensitive' as const } };
  const [items, total, physicalBytes] = await Promise.all([prisma.mediaAsset.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * limit, take: limit,
    select: { id: true, originalName: true, size: true, mimeType: true, visibility: true, archived: true, createdAt: true } }), prisma.mediaAsset.count({ where }), diskBytes(resolve(env.UPLOAD_ROOT))]);
  res.json({ success: true, data: { items, total, page, limit, quota: { perFileBytes: 20 * 1024 * 1024, concurrentUploads: 2, physicalBytes, totalLimitBytes: null } }, requestId: req.id });
});
export const dashboardRouter = router;
