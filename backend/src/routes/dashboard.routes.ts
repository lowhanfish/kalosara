import { Router } from 'express';
import {
  createDashboardUserController,
  getDashboardSummaryController,
  listDashboardAuditLogsController,
  listDashboardUploadsController,
  listDashboardUsersController,
  updateDashboardUserAccessController,
} from '../controllers/dashboard.controller.js';
import {
  authenticate,
  loadActivePrincipal,
  requireMutation,
  requireRoles,
} from '../middlewares/auth.middleware.js';
import { privateNoStore } from '../middlewares/cache-control.middleware.js';
import { createRateLimiter } from '../middlewares/rate-limit.middleware.js';

const createUserLimit = createRateLimiter({
  windowMs: 15 * 60_000,
  limit: 20,
  message: 'Terlalu banyak percobaan pembuatan akun',
});

const updateAccessLimit = createRateLimiter({
  windowMs: 15 * 60_000,
  limit: 10,
  message: 'Terlalu banyak percobaan perubahan akses',
});

const router = Router();
router.use(
  authenticate,
  loadActivePrincipal,
  requireRoles('ADMIN_KELURAHAN', 'LURAH'),
  privateNoStore,
);

router.get('/', getDashboardSummaryController);

router.use(requireRoles('ADMIN_KELURAHAN'));
router.get('/users', listDashboardUsersController);
router.post(
  '/users',
  requireMutation,
  createUserLimit,
  createDashboardUserController,
);
router.post(
  '/users/:id/access',
  requireMutation,
  updateAccessLimit,
  updateDashboardUserAccessController,
);
router.get('/audit', listDashboardAuditLogsController);
router.get('/uploads', listDashboardUploadsController);

export const dashboardRouter = router;
