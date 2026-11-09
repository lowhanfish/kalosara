import type { RequestHandler } from 'express';
import { sendSuccess } from '../lib/http-response.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';

export const getHealthController: RequestHandler = (req, res) => {
  sendSuccess(res, req, { status: 'ok', uptimeSeconds: Math.floor(process.uptime()) });
};

export const getReadyController: RequestHandler = async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    sendSuccess(res, req, { status: 'ready' });
  } catch {
    logger.warn({ event: 'database_not_ready', requestId: req.id }, 'Database is not ready');
    res.status(503).json({
      success: false,
      error: { code: 'NOT_READY', message: 'Database unavailable' },
      requestId: req.id,
    });
  }
};
