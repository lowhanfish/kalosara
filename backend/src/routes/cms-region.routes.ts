import { Router } from 'express';
import {
  getPublicRegionPlaceDetailController,
  listAdminRegionPlacesController,
  listAdminRegionStatisticsController,
  listPublicRegionPlacesController,
  listPublicRegionStatisticsController,
  putAdminRegionPlaceController,
  putAdminRegionStatisticController,
} from '../controllers/cms-region.controller.js';
import {
  authenticate,
  loadActivePrincipal,
  requireMutation,
  requireRoles,
} from '../middlewares/auth.middleware.js';
import { noStore } from '../middlewares/cache-control.middleware.js';

export const regionAdminRouter = Router();
regionAdminRouter.use(
  authenticate,
  loadActivePrincipal,
  requireRoles('ADMIN_KELURAHAN'),
  noStore,
);
regionAdminRouter.get('/statistics', listAdminRegionStatisticsController);
regionAdminRouter.get('/:kind', listAdminRegionPlacesController);
regionAdminRouter.put(
  '/statistics/:id',
  requireMutation,
  putAdminRegionStatisticController,
);
regionAdminRouter.put(
  '/:kind/:id',
  requireMutation,
  putAdminRegionPlaceController,
);

export const publicRegionRouter = Router();
publicRegionRouter.get('/statistics', listPublicRegionStatisticsController);
publicRegionRouter.get('/:kind', listPublicRegionPlacesController);
publicRegionRouter.get('/:kind/:id', getPublicRegionPlaceDetailController);
