import { Router } from 'express';
import {
  getAdminNewsDetailController,
  getAdminNewsPreviewController,
  getPublicNewsArticleController,
  getPublicNewsRedirectController,
  getPublicNewsSitemapController,
  listAdminNewsCategoriesController,
  listAdminNewsController,
  listAdminNewsRevisionsController,
  listPublicNewsCategoriesController,
  listPublicNewsController,
  putAdminNewsCategoryController,
  putAdminNewsController,
  resolvePublicNewsCategorySlugController,
  resolvePublicNewsSlugController,
  rollbackAdminNewsController,
} from '../controllers/cms-news.controller.js';
import {
  authenticate,
  loadActivePrincipal,
  requireMutation,
  requireRoles,
} from '../middlewares/auth.middleware.js';
import { noStore } from '../middlewares/cache-control.middleware.js';

export const newsAdminRouter = Router();
newsAdminRouter.use(
  authenticate,
  loadActivePrincipal,
  requireRoles('ADMIN_KELURAHAN'),
  noStore,
);

newsAdminRouter.get('/categories', listAdminNewsCategoriesController);
newsAdminRouter.put(
  '/categories/:id',
  requireMutation,
  putAdminNewsCategoryController,
);
newsAdminRouter.get('/', listAdminNewsController);
newsAdminRouter.get('/:id', getAdminNewsDetailController);
newsAdminRouter.get('/:id/revisions', listAdminNewsRevisionsController);
newsAdminRouter.put('/:id', requireMutation, putAdminNewsController);
newsAdminRouter.post(
  '/:id/rollback',
  requireMutation,
  rollbackAdminNewsController,
);
newsAdminRouter.get('/:id/preview', getAdminNewsPreviewController);

export const publicNewsRouter = Router();
publicNewsRouter.use(noStore);

publicNewsRouter.get('/', listPublicNewsController);
publicNewsRouter.get('/categories', listPublicNewsCategoriesController);
publicNewsRouter.get('/sitemap', getPublicNewsSitemapController);
publicNewsRouter.get('/resolve/:slug', resolvePublicNewsSlugController);
publicNewsRouter.get(
  '/resolve-category/:slug',
  resolvePublicNewsCategorySlugController,
);
publicNewsRouter.get('/redirect/:slug', getPublicNewsRedirectController);
publicNewsRouter.get(
  ['/articles/:slug', '/:slug'],
  getPublicNewsArticleController,
);
