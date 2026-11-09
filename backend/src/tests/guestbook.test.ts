import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const db = vi.hoisted(() => ({
  guestBookEntry: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
  },
  auditLog: { create: vi.fn() },
  refreshSession: { findUnique: vi.fn() },
  user: { findUnique: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock('../lib/prisma.js', () => ({ prisma: db }));

import { createApp } from '../app.js';
import { signAccessToken } from '../services/auth.service.js';
import {
  guestbookInput,
  guestbookStatusUpdate,
} from '../validators/guestbook.validator.js';

const validWarga = {
  fullName: 'Bpk. Herman Susanto',
  phone: '081234567890',
  nik: '7402010101900001',
  guestType: 'WARGA' as const,
  institution: '',
  addressOrRt: 'RT 02 Watundehoa',
  purpose: 'Pelayanan Administrasi & Surat',
  destinationStaff: 'Pelayanan Umum / Staf Piket',
  notes: 'Urus surat usaha',
};

const validDinas = {
  fullName: 'Ibu Rahmawati, S.STP',
  phone: '085299887766',
  nik: '',
  guestType: 'KEDINASAN' as const,
  institution: 'Kantor Camat Puriala',
  addressOrRt: '',
  purpose: 'Koordinasi Kedinasan',
  destinationStaff: 'Lurah (AMIRULAH, S.Si)',
  notes: 'Rapat koordinasi bansos',
};

beforeEach(() => {
  vi.clearAllMocks();
  db.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
    Array.isArray(fn) ? Promise.all(fn) : fn(db),
  );
});

describe('guestbook input boundaries', () => {
  it('accepts valid warga and dinas submissions', () => {
    expect(guestbookInput.safeParse(validWarga).success).toBe(true);
    expect(guestbookInput.safeParse(validDinas).success).toBe(true);
  });

  it('rejects dinas without institution name', () => {
    const invalidDinas = { ...validDinas, institution: '' };
    const res = guestbookInput.safeParse(invalidDinas);
    expect(res.success).toBe(false);
  });

  it('rejects invalid phone and short names', () => {
    expect(
      guestbookInput.safeParse({ ...validWarga, fullName: 'Al' }).success,
    ).toBe(false);
    expect(
      guestbookInput.safeParse({ ...validWarga, phone: '123' }).success,
    ).toBe(false);
    expect(
      guestbookInput.safeParse({ ...validWarga, nik: '12345' }).success,
    ).toBe(false);
  });

  it('validates status update correctly', () => {
    expect(
      guestbookStatusUpdate.safeParse({
        status: 'SERVED',
        servedBy: 'Petugas A',
        internalNote: 'Sudah selesai',
      }).success,
    ).toBe(true);
    expect(
      guestbookStatusUpdate.safeParse({ status: 'INVALID_STATUS' }).success,
    ).toBe(false);
  });
});

describe('guestbook HTTP endpoints', () => {
  const app = createApp();

  it('POST /api/v1/public/guestbook creates entry and returns 201 with ticketNumber', async () => {
    const mockCreated = {
      id: 'f87b89d6-3e42-45e0-9bc8-8f5b8c3a5e12',
      ticketNumber: 'TM-20261109-1234',
      fullName: validWarga.fullName,
      phone: validWarga.phone,
      nik: validWarga.nik,
      guestType: validWarga.guestType,
      institution: null,
      addressOrRt: validWarga.addressOrRt,
      purpose: validWarga.purpose,
      destinationStaff: validWarga.destinationStaff,
      notes: validWarga.notes,
      status: 'WAITING',
      createdAt: new Date(),
    };

    db.guestBookEntry.create.mockResolvedValue(mockCreated);
    db.auditLog.create.mockResolvedValue({});

    const agent = request.agent(app);
    const csrfRes = await agent.get('/api/v1/auth/csrf').expect(200);
    const csrf = csrfRes.body.data.csrfToken;

    const res = await agent
      .post('/api/v1/public/guestbook')
      .set({
        Origin: 'http://localhost:3000',
        'X-CSRF-Token': csrf,
      })
      .send(validWarga)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe(validWarga.fullName);
    expect(res.body.data.ticketNumber).toMatch(/^TM-/);
    expect(res.headers['cache-control']).toContain('no-store');
  });

  it('GET /api/v1/public/guestbook/ticket/:ticketNumber returns public status', async () => {
    db.guestBookEntry.findUnique.mockResolvedValue({
      ticketNumber: 'TM-20261109-1234',
      fullName: validWarga.fullName,
      guestType: validWarga.guestType,
      purpose: validWarga.purpose,
      destinationStaff: validWarga.destinationStaff,
      status: 'WAITING',
      createdAt: new Date(),
      servedAt: null,
    });

    const res = await request(app)
      .get('/api/v1/public/guestbook/ticket/TM-20261109-1234')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.ticketNumber).toBe('TM-20261109-1234');
    expect(res.body.data.status).toBe('WAITING');
  });

  it('GET /api/v1/public/guestbook/ticket/:ticketNumber returns 404 if not found', async () => {
    db.guestBookEntry.findUnique.mockResolvedValue(null);

    await request(app)
      .get('/api/v1/public/guestbook/ticket/TM-NONEXISTENT')
      .expect(404);
  });

  it('admin routes require authentication', async () => {
    await request(app).get('/api/v1/admin/guestbook').expect(401);
    await request(app).get('/api/v1/admin/guestbook/stats').expect(401);
  });

  it('authenticated admin can list guestbook entries', async () => {
    const userId = '7cf4cfa8-9f32-475b-9d41-3cf4cfa89f32';
    const sessionId = 'f6bd6fc0-50dd-4b06-80b8-b74eb855997e';
    const expiresAt = new Date(Date.now() + 600000);

    db.refreshSession.findUnique.mockResolvedValue({
      userId,
      expiresAt,
      revokedAt: null,
    });

    const adminToken = await signAccessToken(userId, sessionId, expiresAt);
    const cookie = `kalosara_access=${adminToken}`;

    db.user.findUnique.mockResolvedValue({
      id: userId,
      role: 'ADMIN_KELURAHAN',
      isActive: true,
    });

    db.guestBookEntry.count.mockResolvedValue(1);
    db.guestBookEntry.findMany.mockResolvedValue([
      {
        id: 'f87b89d6-3e42-45e0-9bc8-8f5b8c3a5e12',
        ticketNumber: 'TM-20261109-1234',
        fullName: validWarga.fullName,
        phone: validWarga.phone,
        status: 'WAITING',
        createdAt: new Date(),
      },
    ]);

    const res = await request(app)
      .get('/api/v1/admin/guestbook')
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
  });
});
