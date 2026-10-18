import { accountRouter, contactReviewRouter } from './modules/account.js';
import { dashboardRouter } from './modules/dashboard.js';
import { attachAuditContext } from './lib/audit-context.js';
import { regionAdminRouter, publicRegionRouter } from './modules/cms/region.js';
import { contentAdminRouter, publicContentRouter } from './modules/cms/content.js';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
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
  // Next rewrites preserve untrusted forwarding headers. Use the socket address;
  // rate limits are shared behind the local proxy until a verified edge is configured.
  app.set('trust proxy', false);
  app.use(helmet({ strictTransportSecurity: env.APP_ORIGIN.startsWith('https:') ? { maxAge: 31536000 } : false }));
  app.use(pinoHttp({ logger, serializers: { res: (response) => ({ statusCode: response.statusCode }), req: (request) => ({ id: request.id, method: request.method }) }, genReqId: (req, res) => {
    const id = randomUUID();
    res.setHeader('X-Request-Id', id);
    return id;
  } }));
  app.use((req, res, next) => {
    if (/^\/api\/v1\/(?:auth|account|admin)(?:\/|$)/.test(req.path)) res.setHeader('Cache-Control', 'private, no-store');
    next();
  });
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(attachAuditContext);

  app.get('/api/v1/health', (req, res) => {
    res.json({ success: true, data: { status: 'ok', uptimeSeconds: Math.floor(process.uptime()) }, requestId: req.id });
  });
  app.get('/api/v1/ready', async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ success: true, data: { status: 'ready' }, requestId: req.id });
    } catch (error) {
      void error;
      logger.warn({ event: 'database_not_ready', requestId: req.id }, 'Database is not ready');
      res.status(503).json({ success: false, error: { code: 'NOT_READY', message: 'Database unavailable' }, requestId: req.id });
    }
  });

  app.use('/api/v1/account', accountRouter);
  app.use('/api/v1/admin/contact-changes', contactReviewRouter);
  app.use('/api/v1/admin/dashboard', dashboardRouter);
  app.use('/api/v1/admin/region', regionAdminRouter);
  app.use('/api/v1/public/region', publicRegionRouter);
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
