import process from 'node:process';
import { URL } from 'node:url';
// Never fall back to backend/.env. Only a disposable, explicit local test database.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('Set TEST_DATABASE_URL to a disposable local *_test database');
const parsed = new URL(url);
if (parsed.protocol !== 'postgresql:' || !['127.0.0.1', 'localhost'].includes(parsed.hostname) || !/^\/kalosara_[a-z0-9_]+_test$/.test(parsed.pathname) || parsed.search) throw new Error('Refusing non-local or non-test database');
const uploadRoot = mkdtempSync(join(tmpdir(), 'kalosara-db-test-'));
const env = { ...process.env, DATABASE_URL: url, NODE_ENV: 'test', LOG_LEVEL: 'silent', APP_ORIGIN: 'http://localhost:3000', FRONTEND_INTERNAL_URL: 'http://127.0.0.1:3099', CACHE_INVALIDATION_SECRET: 'isolated-test-secret-at-least-32-characters', UPLOAD_ROOT: uploadRoot };
let code = 0;
try {
  const suites = process.argv.slice(2);
  const defaults = ['src/tests/schema.db.test.ts', 'src/tests/auth-flow.db.test.ts', 'src/tests/profile.db.test.ts', 'src/tests/cms.db.test.ts', 'src/tests/public-news.db.test.ts', 'src/tests/content.db.test.ts', 'src/tests/region.db.test.ts', 'src/tests/dashboard.db.test.ts', 'src/tests/account.db.test.ts'];
  for (const args of [['prisma', 'migrate', 'deploy'], ['vitest', 'run', '--no-file-parallelism', ...(suites.length ? suites : defaults)]]) {
    const result = spawnSync('npx', args, { env, stdio: 'inherit' });
    if (result.status !== 0) { code = result.status ?? 1; break; }
  }
} finally { rmSync(uploadRoot, { recursive: true, force: true }); }
process.exit(code);
