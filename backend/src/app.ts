import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { attachAuditContext } from './lib/audit-context.js';
import { logger } from './lib/logger.js';
import {
  errorHandler,
  notFound,
  sensitiveApiCacheGuard,
} from './middlewares/index.js';
import { registerApiRoutes } from './routes/index.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  // Next rewrites preserve untrusted forwarding headers. Use the socket address;
  // rate limits are shared behind the local proxy until a verified edge is configured.
  app.set('trust proxy', false);
  app.use(
    helmet({
      strictTransportSecurity: env.APP_ORIGIN.startsWith('https:')
        ? { maxAge: 31536000 }
        : false,
    }),
  );
  app.use(
    pinoHttp({
      logger,
      serializers: {
        res: (response) => ({ statusCode: response.statusCode }),
        req: (request) => ({ id: request.id, method: request.method }),
      },
      genReqId: (_req, res) => {
        const id = randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
      },
    }),
  );
  app.use(sensitiveApiCacheGuard);
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(attachAuditContext);

  registerApiRoutes(app);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
