import type { GuestStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { transaction } from './common.repository.js';

export async function createGuestBookEntryInTx(params: {
  id: string;
  ticketNumber: string;
  fullName: string;
  phone: string;
  nik: string | null;
  guestType: string;
  institution: string | null;
  addressOrRt: string | null;
  purpose: string;
  destinationStaff: string;
  notes: string | null;
}) {
  return transaction(async (tx) => {
    const entry = await tx.guestBookEntry.create({
      data: {
        id: params.id,
        ticketNumber: params.ticketNumber,
        fullName: params.fullName,
        phone: params.phone,
        nik: params.nik,
        guestType: params.guestType,
        institution: params.institution,
        addressOrRt: params.addressOrRt,
        purpose: params.purpose,
        destinationStaff: params.destinationStaff,
        notes: params.notes,
        status: 'WAITING',
      },
    });

    await tx.auditLog.create({
      data: {
        action: 'GUESTBOOK_ENTRY_CREATED',
        resourceType: 'GuestBookEntry',
        resourceId: params.id,
      },
    });

    return entry;
  });
}

export async function findGuestBookById(id: string) {
  return prisma.guestBookEntry.findUnique({
    where: { id },
  });
}

export async function findGuestBookByTicket(ticketNumber: string) {
  return prisma.guestBookEntry.findUnique({
    where: { ticketNumber },
  });
}

export async function listGuestBookEntries(params: {
  page: number;
  limit: number;
  search?: string;
  status?: GuestStatus;
  guestType?: string;
  date?: string;
  month?: string;
  year?: string;
}) {
  const where: Prisma.GuestBookEntryWhereInput = {};

  if (params.status) {
    where.status = params.status;
  }

  if (params.guestType) {
    where.guestType = params.guestType;
  }

  if (params.search && params.search.trim().length > 0) {
    const query = params.search.trim();
    where.OR = [
      { fullName: { contains: query, mode: 'insensitive' } },
      { ticketNumber: { contains: query, mode: 'insensitive' } },
      { phone: { contains: query } },
      { institution: { contains: query, mode: 'insensitive' } },
      { purpose: { contains: query, mode: 'insensitive' } },
    ];
  }

  if (params.date) {
    const startOfDay = new Date(`${params.date}T00:00:00.000Z`);
    const endOfDay = new Date(`${params.date}T23:59:59.999Z`);
    where.createdAt = {
      gte: startOfDay,
      lte: endOfDay,
    };
  } else if (params.month) {
    const [y, m] = params.month.split('-').map(Number);
    const startOfMonth = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
    const nextMonth = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
    where.createdAt = {
      gte: startOfMonth,
      lt: nextMonth,
    };
  } else if (params.year) {
    const y = Number(params.year);
    const startOfYear = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0));
    const nextYear = new Date(Date.UTC(y + 1, 0, 1, 0, 0, 0, 0));
    where.createdAt = {
      gte: startOfYear,
      lt: nextYear,
    };
  }

  const [total, items] = await Promise.all([
    prisma.guestBookEntry.count({ where }),
    prisma.guestBookEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
  ]);

  return {
    items,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit) || 1,
    },
  };
}

export async function updateGuestBookStatusInTx(params: {
  id: string;
  status: GuestStatus;
  servedBy?: string | null;
  internalNote?: string | null;
  actorId?: string;
}) {
  return transaction(async (tx) => {
    const data: Prisma.GuestBookEntryUpdateInput = {
      status: params.status,
    };

    if (params.status === 'SERVED') {
      data.servedAt = new Date();
      if (params.servedBy) {
        data.servedBy = params.servedBy;
      }
    }

    if (typeof params.internalNote === 'string') {
      data.internalNote = params.internalNote;
    }

    const updated = await tx.guestBookEntry.update({
      where: { id: params.id },
      data,
    });

    await tx.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        action: `GUESTBOOK_STATUS_${params.status}`,
        resourceType: 'GuestBookEntry',
        resourceId: params.id,
      },
    });

    return updated;
  });
}

export async function getGuestBookStats() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  const [todayTotal, todayWaiting, todayServed, totalAllTime] =
    await Promise.all([
      prisma.guestBookEntry.count({
        where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
      prisma.guestBookEntry.count({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
          status: 'WAITING',
        },
      }),
      prisma.guestBookEntry.count({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
          status: 'SERVED',
        },
      }),
      prisma.guestBookEntry.count(),
    ]);

  return {
    todayTotal,
    todayWaiting,
    todayServed,
    totalAllTime,
  };
}
