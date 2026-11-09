import { Router } from 'express';
import {
  createPublicCommunityRequestController,
  getAdminCommunityRequestDetailController,
  getAdminCommunitySectionController,
  getPublicCommunitySectionController,
  listAdminCommunityRequestsController,
  patchAdminCommunityRequestController,
  putAdminCommunitySectionController,
} from '../controllers/community.controller.js';
import {
  authenticate,
  loadActivePrincipal,
  requireMutation,
  requireRoles,
} from '../middlewares/auth.middleware.js';
import { privateNoStore } from '../middlewares/cache-control.middleware.js';
import { createRateLimiter } from '../middlewares/rate-limit.middleware.js';

const intakeLimit = createRateLimiter({
  windowMs: 15 * 60_000,
  limit: 5,
  message: 'Please try again later',
});

export const publicCommunityRouter = Router();
publicCommunityRouter.get(
  '/sections/:slug',
  getPublicCommunitySectionController,
);
publicCommunityRouter.use('/requests', privateNoStore);
publicCommunityRouter.post(
  '/requests',
  intakeLimit,
  requireMutation,
  createPublicCommunityRequestController,
);

export const adminCommunityRouter = Router();
adminCommunityRouter.use(
  authenticate,
  loadActivePrincipal,
  requireRoles('ADMIN_KELURAHAN'),
  privateNoStore,
);
adminCommunityRouter.get('/sections/:slug', getAdminCommunitySectionController);
adminCommunityRouter.put(
  '/sections/:slug',
  requireMutation,
  putAdminCommunitySectionController,
);
adminCommunityRouter.get('/requests', listAdminCommunityRequestsController);
adminCommunityRouter.get(
  '/requests/:id',
  getAdminCommunityRequestDetailController,
);
adminCommunityRouter.patch(
  '/requests/:id',
  requireMutation,
  patchAdminCommunityRequestController,
);
