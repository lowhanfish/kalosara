import { Router, type RequestHandler } from 'express';
import { createHash, randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireMutation } from './auth/routes.js';
import { assertRole, loadActivePrincipal, requireRoles, AccessError } from './auth/authorization.js';
import { lockAccount } from './auth/account-lock.js';
import { hashPassword, verifyPassword } from './auth/password.js';
import { emailSchema, phoneSchema, passwordSchema } from './auth/validation.js';
import { idSchema, pagination, CmsError } from './cms/common.js';

const privateResponse: RequestHandler = (_req, res, next) => { res.setHeader('Cache-Control', 'private, no-store'); next(); };
const limit = () => rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false,
  handler: (req, res) => { res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Terlalu banyak percobaan perubahan akun' }, requestId: req.id }); } });
const passwordProof = z.string().min(1).max(72);
const safeText = (max: number) => z.string().trim().max(max).refine(v => Array.from(v).every(c => { const code = c.charCodeAt(0); return (code >= 32 && code !== 127) || [9, 10, 13].includes(code); }), 'Control characters are not allowed');
const ownSelect = { id: true, email: true, phone: true, role: true, verifiedAt: true, updatedAt: true,
  profile: { select: { displayName: true, address: true } },
  contactChange: { select: { id: true, newEmail: true, newPhone: true, requestedAt: true, expiresAt: true } } } as const;
const contactHash = (user: { email: string; phone: string | null }) => createHash('sha256').update(JSON.stringify([user.email, user.phone])).digest('hex');
async function activeSession(tx: Prisma.TransactionClient, userId: string, sessionId: string) {
  const session = await tx.refreshSession.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== userId || session.revokedAt || session.expiresAt <= new Date()) throw new AccessError(401, 'SESSION_REVOKED', 'Sesi sudah berakhir; masuk kembali');
}
async function ownTransaction<T>(userId: string, sessionId: string, work: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(async tx => {
    await lockAccount(tx, userId);
    assertRole(await tx.user.findUnique({ where: { id: userId } }), ['MASYARAKAT']);
    await activeSession(tx, userId, sessionId);
    return work(tx);
  }, { isolationLevel: 'ReadCommitted' });
}
const router = Router();
router.use(privateResponse, authenticate, loadActivePrincipal, requireRoles('MASYARAKAT'));
router.get('/profile', async (req, res) => {
  if (Object.keys(req.query).length) throw new CmsError(400, 'INVALID_QUERY', 'Profil selalu berasal dari sesi');
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.auth!.userId }, select: ownSelect });
  res.json({ success: true, data: { user }, requestId: req.id });
});
const profileSchema = z.object({ displayName: safeText(120).refine(v => v.length > 0), address: safeText(500).nullable(), expectedUpdatedAt: z.iso.datetime() }).strict();
router.patch('/profile', requireMutation, async (req, res) => {
  const input = profileSchema.parse(req.body); const { userId, sessionId } = req.auth!;
  const user = await ownTransaction(userId, sessionId, async tx => {
    const current = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (current.updatedAt.toISOString() !== input.expectedUpdatedAt) throw new AccessError(409, 'CONFLICT', 'Profil berubah; muat ulang sebelum menyimpan');
    await tx.userProfile.upsert({ where: { userId }, create: { userId, displayName: input.displayName, address: input.address || null }, update: { displayName: input.displayName, address: input.address || null } });
    const user = await tx.user.update({ where: { id: userId }, data: { updatedAt: new Date() }, select: ownSelect });
    await tx.auditLog.create({ data: { actorId: userId, action: 'ACCOUNT_PROFILE_UPDATED', resourceType: 'AccountProfile', resourceId: userId } });
    return user;
  });
  res.json({ success: true, data: { user }, requestId: req.id });
});
const contactSchema = z.object({ newEmail: emailSchema.optional(), newPhone: phoneSchema.optional(), currentPassword: passwordProof }).strict().refine(v => !!v.newEmail || !!v.newPhone);
router.post('/contact-change', requireMutation, limit(), async (req, res) => {
  const input = contactSchema.parse(req.body); const { userId, sessionId } = req.auth!;
  const actor = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!await verifyPassword(input.currentPassword, actor.passwordHash)) throw new AccessError(403, 'REAUTH_REQUIRED', 'Kata sandi saat ini tidak sesuai');
  const pending = await ownTransaction(userId, sessionId, async tx => {
    const current = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (current.passwordHash !== actor.passwordHash) throw new AccessError(409, 'CONFLICT', 'Akun berubah; masuk kembali');
    const newEmail = input.newEmail && input.newEmail !== current.email ? input.newEmail : null;
    const newPhone = input.newPhone && input.newPhone !== current.phone ? input.newPhone : null;
    if (!newEmail && !newPhone) throw new CmsError(400, 'NO_CHANGE', 'Kontak baru sama dengan kontak saat ini');
    const data = { id: randomUUID(), newEmail, newPhone, baseContactHash: contactHash(current), requestedAt: new Date(), expiresAt: new Date(Date.now() + 7 * 86400000) };
    const row = await tx.contactChange.upsert({ where: { userId }, create: { userId, ...data }, update: data, select: ownSelect.contactChange.select });
    await tx.auditLog.create({ data: { actorId: userId, action: 'CONTACT_CHANGE_REQUESTED', resourceType: 'ContactChange', resourceId: row.id } });
    return row;
  });
  res.status(202).json({ success: true, data: { pending, verification: 'MANUAL_OFFICE', message: 'Kontak belum berubah. Verifikasi kepemilikan kontak baru kepada petugas; permintaan berlaku 7 hari.' }, requestId: req.id });
});
router.delete('/contact-change/:id', requireMutation, async (req, res) => {
  const id = idSchema.parse(req.params.id); const { userId, sessionId } = req.auth!;
  await ownTransaction(userId, sessionId, async tx => {
    const deleted = await tx.contactChange.deleteMany({ where: { id, userId } });
    if (deleted.count !== 1) throw new CmsError(404, 'NOT_FOUND', 'Permintaan tidak ditemukan');
    await tx.auditLog.create({ data: { actorId: userId, action: 'CONTACT_CHANGE_CANCELLED', resourceType: 'ContactChange', resourceId: id } });
  });
  res.json({ success: true, data: { cancelled: true }, requestId: req.id });
});
const passwordChangeSchema = z.object({ currentPassword: passwordProof, newPassword: passwordSchema, revokeOtherSessions: z.boolean() }).strict();
router.post('/password', requireMutation, limit(), async (req, res) => {
  const input = passwordChangeSchema.parse(req.body); const { userId, sessionId } = req.auth!;
  const actor = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!await verifyPassword(input.currentPassword, actor.passwordHash)) throw new AccessError(403, 'REAUTH_REQUIRED', 'Kata sandi saat ini tidak sesuai');
  if (await verifyPassword(input.newPassword, actor.passwordHash)) throw new CmsError(400, 'PASSWORD_UNCHANGED', 'Pilih kata sandi baru yang berbeda');
  const passwordHash = await hashPassword(input.newPassword);
  await ownTransaction(userId, sessionId, async tx => {
    const current = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (current.passwordHash !== actor.passwordHash) throw new AccessError(409, 'CONFLICT', 'Akun berubah; masuk kembali');
    await tx.user.update({ where: { id: userId }, data: { passwordHash } });
    if (input.revokeOtherSessions) await tx.refreshSession.updateMany({ where: { userId, id: { not: sessionId }, revokedAt: null }, data: { revokedAt: new Date() } });
    await tx.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } });
    // A password change invalidates unverified requests, preventing stale takeover attempts.
    await tx.contactChange.deleteMany({ where: { userId } });
    await tx.auditLog.create({ data: { actorId: userId, action: input.revokeOtherSessions ? 'PASSWORD_CHANGED_REVOKE_OTHERS' : 'PASSWORD_CHANGED_KEEP_OTHERS', resourceType: 'User', resourceId: userId } });
  });
  res.json({ success: true, data: { changed: true, otherSessionsRevoked: input.revokeOtherSessions }, requestId: req.id });
});
export const accountRouter = router;

const admin = Router();
admin.use(privateResponse, authenticate, loadActivePrincipal, requireRoles('ADMIN_KELURAHAN'));
admin.get('/', async (req, res) => {
  const { page, limit: take, search } = pagination.parse(req.query);
  const where = { user: { email: { contains: search, mode: 'insensitive' as const } } };
  const [items, total] = await prisma.$transaction([prisma.contactChange.findMany({ where, orderBy: [{ requestedAt: 'desc' }, { id: 'desc' }], take, skip: (page - 1) * take,
    select: { id: true, userId: true, newEmail: true, newPhone: true, requestedAt: true, expiresAt: true, user: { select: { email: true, phone: true } } } }), prisma.contactChange.count({ where })]);
  res.json({ success: true, data: { items, total, page, limit: take }, requestId: req.id });
});
const reviewSchema = z.object({ decision: z.enum(['APPROVE', 'REJECT']), currentPassword: passwordProof, identityVerified: z.literal(true), contactOwnershipVerified: z.boolean() }).strict().refine(v => v.decision !== 'APPROVE' || v.contactOwnershipVerified);
admin.post('/:id/review', requireMutation, limit(), async (req, res) => {
  const id = idSchema.parse(req.params.id); const input = reviewSchema.parse(req.body); const { userId: actorId, sessionId } = req.auth!;
  const actor = await prisma.user.findUniqueOrThrow({ where: { id: actorId } });
  if (!await verifyPassword(input.currentPassword, actor.passwordHash)) throw new AccessError(403, 'REAUTH_REQUIRED', 'Kata sandi admin tidak sesuai');
  const request = await prisma.contactChange.findUnique({ where: { id }, select: { userId: true } });
  if (!request || request.userId === actorId) throw new CmsError(404, 'NOT_FOUND', 'Permintaan tidak ditemukan');
  try {
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(1195461711)`;
      await lockAccount(tx, request.userId);
      const currentActor = await tx.user.findUnique({ where: { id: actorId } });
      assertRole(currentActor, ['ADMIN_KELURAHAN']); await activeSession(tx, actorId, sessionId);
      if (currentActor!.passwordHash !== actor.passwordHash) throw new AccessError(409, 'CONFLICT', 'Akun admin berubah');
      const pending = await tx.contactChange.findUnique({ where: { id } });
      if (!pending || pending.userId !== request.userId) throw new AccessError(409, 'CONFLICT', 'Permintaan sudah berubah; muat ulang');
      if (input.decision === 'APPROVE') {
        const target = await tx.user.findUniqueOrThrow({ where: { id: request.userId } });
        assertRole(target, ['MASYARAKAT']);
        if (pending.expiresAt <= new Date() || pending.baseContactHash !== contactHash(target)) throw new AccessError(409, 'CONTACT_REQUEST_STALE', 'Permintaan kedaluwarsa atau kontak berubah; minta pengajuan ulang');
        await tx.user.update({ where: { id: target.id }, data: { ...(pending.newEmail ? { email: pending.newEmail, verifiedAt: new Date() } : {}), ...(pending.newPhone ? { phone: pending.newPhone } : {}) } });
        await tx.refreshSession.updateMany({ where: { userId: target.id, revokedAt: null }, data: { revokedAt: new Date() } });
        await tx.passwordResetToken.updateMany({ where: { userId: target.id, usedAt: null }, data: { usedAt: new Date() } });
      }
      await tx.contactChange.delete({ where: { id } });
      await tx.auditLog.create({ data: { actorId, action: `CONTACT_CHANGE_${input.decision}`, resourceType: 'ContactChange', resourceId: id } });
    }, { isolationLevel: 'ReadCommitted' });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new AccessError(409, 'CONTACT_UNAVAILABLE', 'Kontak tidak dapat digunakan; verifikasi kembali');
    throw error;
  }
  res.json({ success: true, data: { reviewed: true }, requestId: req.id });
});
export const contactReviewRouter = admin;
