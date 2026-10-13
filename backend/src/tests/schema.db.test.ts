import { randomUUID, createHash } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
afterAll(async () => db.$disconnect());

describe('PostgreSQL account constraints', () => {
  it('enforces email, phone, and session token uniqueness', async () => {
    const marker = randomUUID().replaceAll('-', '');
    const email = `test-${marker}@example.invalid`;
    const otherEmail = `other-${marker}@example.invalid`;
    const phone = `+62${Date.now().toString().slice(-11)}`;
    const tokenHash = createHash('sha256').update(marker).digest('hex');
    const user = await db.user.create({ data: { email, phone, passwordHash: 'test-only-hash' } });
    try {
      await expect(db.user.create({ data: { email: email.toUpperCase(), passwordHash: 'test-only-hash' } }))
        .rejects.toMatchObject({ code: 'P2002' });
      await expect(db.user.create({ data: { email: otherEmail, phone, passwordHash: 'test-only-hash' } }))
        .rejects.toMatchObject({ code: 'P2002' });
      await db.refreshSession.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 60_000) } });
      await expect(db.refreshSession.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 60_000) } }))
        .rejects.toMatchObject({ code: 'P2002' });
    } finally {
      await db.user.delete({ where: { id: user.id } });
    }
  });
});
