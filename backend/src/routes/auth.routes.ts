import { Router } from 'express';
import {
  forgotPasswordController,
  getAuthenticatedMeController,
  getCsrfController,
  loginController,
  logoutAllController,
  logoutController,
  refreshSessionController,
  registerPublicController,
} from '../controllers/auth.controller.js';
import {
  authenticate,
  loadActivePrincipal,
  requireMutation,
} from '../middlewares/auth.middleware.js';
import { createRateLimiter } from '../middlewares/rate-limit.middleware.js';

const router = Router();

const registerLimit = createRateLimiter({ windowMs: 60 * 60_000, limit: 5 });
const loginLimit = createRateLimiter({ windowMs: 15 * 60_000, limit: 10 });
const forgotLimit = createRateLimiter({ windowMs: 60 * 60_000, limit: 5 });

router.get('/csrf', getCsrfController);
router.post(
  '/register',
  registerLimit,
  requireMutation,
  registerPublicController,
);
router.post('/login', loginLimit, requireMutation, loginController);
router.post('/refresh', requireMutation, refreshSessionController);
router.post('/logout', requireMutation, logoutController);
router.post(
  '/logout-all',
  requireMutation,
  authenticate,
  loadActivePrincipal,
  logoutAllController,
);
router.get(
  '/me',
  authenticate,
  loadActivePrincipal,
  getAuthenticatedMeController,
);
router.post(
  '/forgot-password',
  forgotLimit,
  requireMutation,
  forgotPasswordController,
);

export const authRouter = router;
export { authenticate, requireMutation };
