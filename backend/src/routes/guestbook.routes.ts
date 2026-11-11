import { Router } from 'express';
import {
  createPublicGuestbookController,
  getAdminGuestbookDetailController,
  getAdminGuestbookStatsController,
  getPublicTicketStatusController,
  listAdminGuestbookController,
  patchAdminGuestbookStatusController,
} from '../controllers/guestbook.controller.js';
import {
  authenticate,
  loadActivePrincipal,
  requireMutation,
  requireRoles,
} from '../middlewares/auth.middleware.js';
import { privateNoStore } from '../middlewares/cache-control.middleware.js';
import { createRateLimiter } from '../middlewares/rate-limit.middleware.js';

const guestbookSubmissionLimit = createRateLimiter({
  windowMs: 15 * 60_000,
  limit: 10,
  message:
    'Terlalu banyak permintaan buku tamu, silakan coba lagi beberapa saat lagi.',
});

export const publicGuestbookRouter = Router();
publicGuestbookRouter.use(privateNoStore);
publicGuestbookRouter.post(
  '/',
  guestbookSubmissionLimit,
  requireMutation,
  createPublicGuestbookController,
);
publicGuestbookRouter.get(
  '/ticket/:ticketNumber',
  getPublicTicketStatusController,
);

export const adminGuestbookRouter = Router();
adminGuestbookRouter.use(
  authenticate,
  loadActivePrincipal,
  requireRoles('ADMIN_KELURAHAN', 'LURAH'),
  privateNoStore,
);

adminGuestbookRouter.get('/', listAdminGuestbookController);
adminGuestbookRouter.get('/stats', getAdminGuestbookStatsController);
adminGuestbookRouter.get('/:id', getAdminGuestbookDetailController);
adminGuestbookRouter.patch(
  '/:id/status',
  requireRoles('ADMIN_KELURAHAN', 'LURAH'),
  requireMutation,
  patchAdminGuestbookStatusController,
);
