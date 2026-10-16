import { drainInvalidations } from './modules/cms/cache-invalidation.js';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';

const server = createApp().listen(env.PORT, '0.0.0.0', () => {
  logger.info({ port: env.PORT }, 'KALOSARA API listening');
});

const cacheTimer = setInterval(() => void drainInvalidations(), 30000);
cacheTimer.unref();
void drainInvalidations();
let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  clearInterval(cacheTimer);
  logger.info({ signal }, 'Shutting down');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
