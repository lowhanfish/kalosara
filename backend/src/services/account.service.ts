import { createHash } from 'node:crypto';
import { AccessError, CmsError } from '../lib/errors.js';
import {
  accountProfileSchema,
  contactChangeSchema,
  contactReviewSchema,
  passwordChangeSchema,
} from '../validators/account.validator.js';
import { idSchema, pagination } from '../validators/common.validator.js';
import {
  deleteOwnContactChangeInTx,
  findAccountUserById,
  findContactChangeUserId,
  findOwnAccountProfile,
  listContactChangesForAdminRepo,
  reviewContactChangeInTx,
  updateOwnAccountProfileInTx,
  updateOwnPasswordInTx,
  upsertOwnContactChangeInTx,
} from '../repositories/account.repository.js';
import { hashPassword, verifyPassword } from './auth.service.js';

export const computeContactHash = (user: {
  email: string;
  phone: string | null;
}) =>
  createHash('sha256')
    .update(JSON.stringify([user.email, user.phone]))
    .digest('hex');

export async function getOwnAccountProfileService(
  userId: string,
  queryKeysCount: number,
) {
  if (queryKeysCount > 0) {
    throw new CmsError(400, 'INVALID_QUERY', 'Profil selalu berasal dari sesi');
  }
  return findOwnAccountProfile(userId);
}

export async function updateOwnAccountProfileService(
  userId: string,
  sessionId: string,
  body: unknown,
) {
  const input = accountProfileSchema.parse(body);
  return updateOwnAccountProfileInTx(userId, sessionId, input);
}

export async function requestOwnContactChangeService(
  userId: string,
  sessionId: string,
  body: unknown,
) {
  const input = contactChangeSchema.parse(body);
  const actor = await findAccountUserById(userId);
  if (!(await verifyPassword(input.currentPassword, actor.passwordHash))) {
    throw new AccessError(
      403,
      'REAUTH_REQUIRED',
      'Kata sandi saat ini tidak sesuai',
    );
  }
  const pending = await upsertOwnContactChangeInTx({
    userId,
    sessionId,
    expectedPasswordHash: actor.passwordHash,
    newEmail: input.newEmail,
    newPhone: input.newPhone,
    computeContactHash,
  });
  return {
    pending,
    verification: 'MANUAL_OFFICE' as const,
    message:
      'Kontak belum berubah. Verifikasi kepemilikan kontak baru kepada petugas; permintaan berlaku 7 hari.',
  };
}

export async function cancelOwnContactChangeService(
  userId: string,
  sessionId: string,
  rawId: unknown,
) {
  const id = idSchema.parse(rawId);
  await deleteOwnContactChangeInTx(userId, sessionId, id);
  return { cancelled: true };
}

export async function changeOwnPasswordService(
  userId: string,
  sessionId: string,
  body: unknown,
) {
  const input = passwordChangeSchema.parse(body);
  const actor = await findAccountUserById(userId);
  if (!(await verifyPassword(input.currentPassword, actor.passwordHash))) {
    throw new AccessError(
      403,
      'REAUTH_REQUIRED',
      'Kata sandi saat ini tidak sesuai',
    );
  }
  if (await verifyPassword(input.newPassword, actor.passwordHash)) {
    throw new CmsError(
      400,
      'PASSWORD_UNCHANGED',
      'Pilih kata sandi baru yang berbeda',
    );
  }
  const passwordHash = await hashPassword(input.newPassword);
  await updateOwnPasswordInTx({
    userId,
    sessionId,
    expectedPasswordHash: actor.passwordHash,
    newPasswordHash: passwordHash,
    revokeOtherSessions: input.revokeOtherSessions,
  });
  return { changed: true, otherSessionsRevoked: input.revokeOtherSessions };
}

export async function listAdminContactChangesService(query: unknown) {
  const { page, limit: take, search } = pagination.parse(query);
  const [items, total] = await listContactChangesForAdminRepo(
    page,
    take,
    search,
  );
  return { items, total, page, limit: take };
}

export async function reviewAdminContactChangeService(
  actorId: string,
  sessionId: string,
  rawId: unknown,
  body: unknown,
) {
  const id = idSchema.parse(rawId);
  const input = contactReviewSchema.parse(body);
  const actor = await findAccountUserById(actorId);
  if (!(await verifyPassword(input.currentPassword, actor.passwordHash))) {
    throw new AccessError(
      403,
      'REAUTH_REQUIRED',
      'Kata sandi admin tidak sesuai',
    );
  }
  const request = await findContactChangeUserId(id);
  if (!request || request.userId === actorId) {
    throw new CmsError(404, 'NOT_FOUND', 'Permintaan tidak ditemukan');
  }
  await reviewContactChangeInTx({
    id,
    actorId,
    sessionId,
    expectedActorPasswordHash: actor.passwordHash,
    targetUserId: request.userId,
    decision: input.decision,
    computeContactHash,
  });
  return { reviewed: true };
}
