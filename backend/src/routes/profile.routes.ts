import { Router } from 'express';
import {
  getAdminProfileController,
  getPublicProfileController,
  putProfileOfficialController,
  putProfilePageController,
  putProfileSettingsController,
} from '../controllers/profile.controller.js';
import {
  authenticate,
  loadActivePrincipal,
  requireMutation,
  requireRoles,
} from '../middlewares/auth.middleware.js';
import { noStore } from '../middlewares/cache-control.middleware.js';

export const publicProfileRouter = Router();
publicProfileRouter.get('/', getPublicProfileController);

export const profileAdminRouter = Router();
profileAdminRouter.use(
  authenticate,
  loadActivePrincipal,
  requireRoles('ADMIN_KELURAHAN'),
  noStore,
);
profileAdminRouter.get('/', getAdminProfileController);
profileAdminRouter.put(
  '/settings',
  requireMutation,
  putProfileSettingsController,
);
profileAdminRouter.put(
  '/pages/:slug',
  requireMutation,
  putProfilePageController,
);
profileAdminRouter.put(
  '/officials/:id',
  requireMutation,
  putProfileOfficialController,
);
