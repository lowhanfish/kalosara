import { env } from '../config/env.js';
// Also guard direct Vitest invocations, not just npm run test:db.
const url = new URL(env.DATABASE_URL);
if (!['127.0.0.1', 'localhost'].includes(url.hostname) || !/^\/kalosara_[a-z0-9_]+_test$/.test(url.pathname) || url.search) {
  throw new Error('Database tests require an explicit disposable local kalosara_*_test database; refusing to run');
}
