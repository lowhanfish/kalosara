import { Router } from 'express';
import {
  getAdminMediaFileController,
  getPublicMediaFileController,
  listAdminMediaController,
  patchAdminMediaController,
  uploadAdminMediaController,
} from '../controllers/cms-media.controller.js';
import {
  authenticate,
  loadActivePrincipal,
  requireMutation,
  requireRoles,
} from '../middlewares/auth.middleware.js';
import { noStore } from '../middlewares/cache-control.middleware.js';
import { createRateLimiter } from '../middlewares/rate-limit.middleware.js';

const uploadLimit = createRateLimiter({
  windowMs: 15 * 60_000,
  limit: 30,
  code: 'UPLOAD_RATE_LIMITED',
  message: 'Too many uploads',
});

export const mediaAdminRouter = Router();
mediaAdminRouter.use(
  authenticate,
  loadActivePrincipal,
  requireRoles('ADMIN_KELURAHAN'),
  noStore,
);
mediaAdminRouter.get('/', listAdminMediaController);
mediaAdminRouter.post(
  '/',
  requireMutation,
  uploadLimit,
  uploadAdminMediaController,
);
mediaAdminRouter.patch('/:id', requireMutation, patchAdminMediaController);
mediaAdminRouter.get('/:id/file', getAdminMediaFileController);

export const publicMediaRouter = Router();
publicMediaRouter.get('/:id', getPublicMediaFileController);
