import express from 'express';
import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { errorHandler, notFound } from './middlewares/error-handler.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(pinoHttp({ logger, genReqId: (req, res) => {
    const id = randomUUID();
    res.setHeader('X-Request-Id', id);
    return id;
  } }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/v1/health', (req, res) => {
    res.json({ success: true, data: { status: 'ok' }, requestId: req.id });
  });
  app.get('/api/v1/ready', async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ success: true, data: { status: 'ready' }, requestId: req.id });
    } catch (error) {
      logger.warn({ err: error }, 'Database is not ready');
      res.status(503).json({ success: false, error: { code: 'NOT_READY', message: 'Database unavailable' }, requestId: req.id });
    }
  });

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
