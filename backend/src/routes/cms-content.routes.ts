import { Router } from 'express';
import {
  listAdminContentController,
  listPublicContentController,
  putAdminContentController,
} from '../controllers/cms-content.controller.js';
import {
  authenticate,
  loadActivePrincipal,
  requireMutation,
  requireRoles,
} from '../middlewares/auth.middleware.js';
import { noStore } from '../middlewares/cache-control.middleware.js';

export const contentAdminRouter = Router();
contentAdminRouter.use(
  authenticate,
  loadActivePrincipal,
  requireRoles('ADMIN_KELURAHAN'),
  noStore,
);
contentAdminRouter.get('/:kind', listAdminContentController);
contentAdminRouter.put(
  '/:kind/:id',
  requireMutation,
  putAdminContentController,
);

export const publicContentRouter = Router();
publicContentRouter.get('/:kind', listPublicContentController);
