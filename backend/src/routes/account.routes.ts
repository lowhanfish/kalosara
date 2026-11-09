import { Router } from 'express';
import {
  changeOwnPasswordController,
  createContactChangeController,
  deleteContactChangeController,
  getOwnProfileController,
  listAdminContactChangesController,
  reviewAdminContactChangeController,
  updateOwnProfileController,
} from '../controllers/account.controller.js';
import {
  authenticate,
  loadActivePrincipal,
  requireMutation,
  requireRoles,
} from '../middlewares/auth.middleware.js';
import { privateNoStore } from '../middlewares/cache-control.middleware.js';
import { createRateLimiter } from '../middlewares/rate-limit.middleware.js';

const accountRateLimit = () =>
  createRateLimiter({
    windowMs: 15 * 60_000,
    limit: 10,
    message: 'Terlalu banyak percobaan perubahan akun',
  });

const router = Router();
router.use(
  privateNoStore,
  authenticate,
  loadActivePrincipal,
  requireRoles('MASYARAKAT'),
);

router.get('/profile', getOwnProfileController);
router.patch('/profile', requireMutation, updateOwnProfileController);
router.post(
  '/contact-change',
  requireMutation,
  accountRateLimit(),
  createContactChangeController,
);
router.delete(
  '/contact-change/:id',
  requireMutation,
  deleteContactChangeController,
);
router.post(
  '/password',
  requireMutation,
  accountRateLimit(),
  changeOwnPasswordController,
);

export const accountRouter = router;

const admin = Router();
admin.use(
  privateNoStore,
  authenticate,
  loadActivePrincipal,
  requireRoles('ADMIN_KELURAHAN'),
);

admin.get('/', listAdminContactChangesController);
admin.post(
  '/:id/review',
  requireMutation,
  accountRateLimit(),
  reviewAdminContactChangeController,
);

export const contactReviewRouter = admin;
