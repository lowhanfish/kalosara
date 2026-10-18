// Disposable browser fixture only. Never loads .env or falls back to DATABASE_URL.
import { URL } from 'node:url';
import process from 'node:process';
import { randomBytes, randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const value = process.env.TEST_DATABASE_URL;
if (!value) throw new Error('Explicit TEST_DATABASE_URL required');
const url = new URL(value);
if (
  url.protocol !== 'postgresql:' ||
  !['localhost', '127.0.0.1'].includes(url.hostname) ||
  !/^\/kalosara_[a-z0-9_]+_test$/.test(url.pathname) ||
  url.search
)
  throw new Error('Disposable local DB required');
const output = process.env.QA_FIXTURE_FILE;
if (!output?.startsWith('/tmp/kalosara-'))
  throw new Error('Temporary fixture path required');
const db = new PrismaClient({ datasourceUrl: value });
try {
  const password = randomBytes(24).toString('base64url');
  const passwordHash = await bcrypt.hash(password, 12);
  const users = {};
  for (const [name, role] of [
    ['admin', 'ADMIN_KELURAHAN'],
    ['citizen', 'MASYARAKAT'],
    ['lurah', 'LURAH'],
  ]) {
    const email = `p13-${name}-${randomUUID()}@example.invalid`;
    const user = await db.user.create({
      data: {
        email,
        role,
        passwordHash,
        profile: { create: { displayName: `QA ${name}` } },
      },
    });
    users[name] = { id: user.id, email, password };
  }
  writeFileSync(output, JSON.stringify(users), { mode: 0o600, flag: 'wx' });
} finally {
  await db.$disconnect();
}
