import { contentAdminRouter, publicContentRouter } from './modules/cms/content.js';
import express from 'express';
import { newsAdminRouter } from './modules/cms/news.js';
import { publicNewsRouter } from './modules/cms/public-news.js';
import { mediaAdminRouter, publicMediaRouter } from './modules/cms/media.js';
import { publicProfileRouter, profileAdminRouter } from './modules/profile.js';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { errorHandler, notFound } from './middlewares/error-handler.js';
import { publicSettingsRouter } from './modules/public-settings.js';
import { authRouter } from './modules/auth/routes.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(pinoHttp({ logger, genReqId: (req, res) => {
    const id = randomUUID();
    res.setHeader('X-Request-Id', id);
    return id;
  } }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

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

  app.use('/api/v1/admin/content', contentAdminRouter);
  app.use('/api/v1/public/content', publicContentRouter);
  app.use('/api/v1/admin/news', newsAdminRouter);
  app.use('/api/v1/admin/media', mediaAdminRouter);
  app.use('/api/v1/public/media', publicMediaRouter);
  app.use('/api/v1/public/news', publicNewsRouter);
  app.use('/api/v1/public/profile', publicProfileRouter);
  app.use('/api/v1/admin/profile', profileAdminRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/public/settings', publicSettingsRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
