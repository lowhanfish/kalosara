import { randomUUID } from 'node:crypto';
import type { GuestStatus } from '@prisma/client';
import { CmsError } from '../lib/errors.js';
import {
  createGuestBookEntryInTx,
  findGuestBookById,
  findGuestBookByTicket,
  getGuestBookStats,
  listGuestBookEntries,
  updateGuestBookStatusInTx,
} from '../repositories/guestbook.repository.js';
import type {
  guestbookInput,
  guestbookQuery,
  guestbookStatusUpdate,
} from '../validators/guestbook.validator.js';

export async function createPublicGuestBookService(
  input: ReturnType<typeof guestbookInput.parse>,
) {
  const id = randomUUID();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const ticketNumber = `TM-${dateStr}-${randomSuffix}`;

  const entry = await createGuestBookEntryInTx({
    id,
    ticketNumber,
    fullName: input.fullName,
    phone: input.phone,
    nik: input.nik || null,
    guestType: input.guestType,
    institution: input.institution || null,
    addressOrRt: input.addressOrRt || null,
    purpose: input.purpose,
    destinationStaff: input.destinationStaff,
    notes: input.notes || null,
  });

  return {
    id: entry.id,
    ticketNumber: entry.ticketNumber,
    fullName: entry.fullName,
    guestType: entry.guestType,
    purpose: entry.purpose,
    destinationStaff: entry.destinationStaff,
    status: entry.status,
    createdAt: entry.createdAt,
  };
}

export async function getPublicTicketStatusService(ticketNumber: string) {
  const entry = await findGuestBookByTicket(ticketNumber);
  if (!entry) {
    throw new CmsError(404, 'NOT_FOUND', 'Tiket kunjungan tidak ditemukan');
  }

  return {
    ticketNumber: entry.ticketNumber,
    fullName: entry.fullName,
    guestType: entry.guestType,
    purpose: entry.purpose,
    destinationStaff: entry.destinationStaff,
    status: entry.status,
    createdAt: entry.createdAt,
    servedAt: entry.servedAt,
  };
}

export async function listAdminGuestBookService(
  query: ReturnType<typeof guestbookQuery.parse>,
) {
  return listGuestBookEntries({
    page: query.page,
    limit: query.limit,
    search: query.search,
    status: query.status as GuestStatus | undefined,
    guestType: query.guestType,
    date: query.date,
    month: query.month,
    year: query.year,
  });
}

export async function getAdminGuestBookDetailService(id: string) {
  const entry = await findGuestBookById(id);
  if (!entry) {
    throw new CmsError(404, 'NOT_FOUND', 'Data kunjungan tamu tidak ditemukan');
  }
  return entry;
}

export async function updateAdminGuestBookStatusService(
  id: string,
  input: ReturnType<typeof guestbookStatusUpdate.parse>,
  actorId?: string,
) {
  const existing = await findGuestBookById(id);
  if (!existing) {
    throw new CmsError(404, 'NOT_FOUND', 'Data kunjungan tamu tidak ditemukan');
  }

  return updateGuestBookStatusInTx({
    id,
    status: input.status,
    servedBy: input.servedBy,
    internalNote: input.internalNote,
    actorId,
  });
}

export async function getAdminGuestBookStatsService() {
  return getGuestBookStats();
}
