import { Router, type Express } from 'express';
import { accountRouter, contactReviewRouter } from './account.routes.js';
import { authRouter } from './auth.routes.js';
import {
  contentAdminRouter,
  publicContentRouter,
} from './cms-content.routes.js';
import { mediaAdminRouter, publicMediaRouter } from './cms-media.routes.js';
import { newsAdminRouter, publicNewsRouter } from './cms-news.routes.js';
import { publicRegionRouter, regionAdminRouter } from './cms-region.routes.js';
import {
  adminCommunityRouter,
  publicCommunityRouter,
} from './community.routes.js';
import { dashboardRouter } from './dashboard.routes.js';
import {
  adminGuestbookRouter,
  publicGuestbookRouter,
} from './guestbook.routes.js';
import { profileAdminRouter, publicProfileRouter } from './profile.routes.js';
import { publicSettingsRouter } from './public-settings.routes.js';
import { systemRouter } from './system.routes.js';

export function createApiV1Router(): Router {
  const router = Router();
  router.use(systemRouter);
  router.use('/public/guestbook', publicGuestbookRouter);
  router.use('/admin/guestbook', adminGuestbookRouter);
  router.use('/public/community', publicCommunityRouter);
  router.use('/admin/community', adminCommunityRouter);
  router.use('/account', accountRouter);
  router.use('/admin/contact-changes', contactReviewRouter);
  router.use('/admin/dashboard', dashboardRouter);
  router.use('/admin/region', regionAdminRouter);
  router.use('/public/region', publicRegionRouter);
  router.use('/admin/content', contentAdminRouter);
  router.use('/public/content', publicContentRouter);
  router.use('/admin/news', newsAdminRouter);
  router.use('/admin/media', mediaAdminRouter);
  router.use('/public/media', publicMediaRouter);
  router.use('/public/news', publicNewsRouter);
  router.use('/public/profile', publicProfileRouter);
  router.use('/admin/profile', profileAdminRouter);
  router.use('/auth', authRouter);
  router.use('/public/settings', publicSettingsRouter);
  return router;
}

export function registerApiRoutes(app: Express): void {
  app.use('/api/v1', createApiV1Router());
}

export {
  accountRouter,
  adminCommunityRouter,
  adminGuestbookRouter,
  authRouter,
  contactReviewRouter,
  contentAdminRouter,
  dashboardRouter,
  mediaAdminRouter,
  newsAdminRouter,
  profileAdminRouter,
  publicCommunityRouter,
  publicContentRouter,
  publicGuestbookRouter,
  publicMediaRouter,
  publicNewsRouter,
  publicProfileRouter,
  publicRegionRouter,
  publicSettingsRouter,
  regionAdminRouter,
  systemRouter,
};
