import { Router, type RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { rateLimit } from 'express-rate-limit';
import { prisma } from '../../lib/prisma.js';
import { AccessError, loadActivePrincipal } from './authorization.js';
import { ACCESS_COOKIE, REFRESH_COOKIE, clearSessionCookies, issueCsrf, setSessionCookies, validateMutation } from './cookies.js';
import { registerPublicAccount } from './register-public.js';
import { login, logout, logoutAll, refreshSession } from './session-service.js';
import { verifyAccessToken } from './tokens.js';

const router = Router();

function limiter(windowMs: number, limit: number): RequestHandler {
  return rateLimit({
    windowMs, limit, standardHeaders: 'draft-8', legacyHeaders: false,
    handler: (req, res) => res.status(429).json({
      success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' }, requestId: req.id,
    }),
  });
}

const registerLimit = limiter(60 * 60_000, 5);
const loginLimit = limiter(15 * 60_000, 10);
const forgotLimit = limiter(60 * 60_000, 5);

export const requireMutation: RequestHandler = (req, _res, next) => {
  try { validateMutation(req); next(); } catch (error) { next(error); }
};

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const raw = req.cookies?.[ACCESS_COOKIE];
    if (typeof raw !== 'string') throw new AccessError(401, 'UNAUTHENTICATED', 'Access token required');
    const claims = await verifyAccessToken(raw);
    const session = await prisma.refreshSession.findUnique({
      where: { id: claims.sessionId }, select: { userId: true, revokedAt: true, expiresAt: true },
    });
    if (!session || session.userId !== claims.userId || session.revokedAt || session.expiresAt <= new Date()) {
      throw new AccessError(401, 'SESSION_REVOKED', 'Session revoked');
    }
    req.auth = claims;
    next();
  } catch (error) { next(error); }
};

router.get('/csrf', (req, res) => {
  res.json({ success: true, data: { csrfToken: issueCsrf(res) }, requestId: req.id });
});

router.post('/register', registerLimit, requireMutation, async (req, res) => {
  try {
    const user = await registerPublicAccount(req.body);
    res.status(201).json({ success: true, data: { user }, requestId: req.id });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AccessError(409, 'ACCOUNT_EXISTS', 'Account already exists');
    }
    throw error;
  }
});

router.post('/login', loginLimit, requireMutation, async (req, res) => {
  const result = await login(req.body, req);
  setSessionCookies(res, result.access, result.refresh, result.expiresAt);
  res.json({ success: true, data: { user: result.user }, requestId: req.id });
});

router.post('/refresh', requireMutation, async (req, res) => {
  const result = await refreshSession(req.cookies?.[REFRESH_COOKIE], req);
  setSessionCookies(res, result.access, result.refresh, result.expiresAt);
  res.json({ success: true, data: { refreshed: true }, requestId: req.id });
});

router.post('/logout', requireMutation, async (req, res) => {
  await logout(req.cookies?.[REFRESH_COOKIE]);
  clearSessionCookies(res);
  res.json({ success: true, data: { loggedOut: true }, requestId: req.id });
});

router.post('/logout-all', requireMutation, authenticate, loadActivePrincipal, async (req, res) => {
  await logoutAll(req.auth!.userId);
  clearSessionCookies(res);
  res.json({ success: true, data: { loggedOut: true }, requestId: req.id });
});

router.get('/me', authenticate, loadActivePrincipal, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.auth!.userId },
    select: { id: true, email: true, phone: true, role: true, isActive: true, verifiedAt: true, createdAt: true,
      profile: { select: { displayName: true } } },
  });
  res.json({ success: true, data: { user }, requestId: req.id });
});

// Delivery and reset completion are reserved for a later prompt; this response never checks account existence.
router.post('/forgot-password', forgotLimit, requireMutation, (req, res) => {
  res.status(503).json({ success: false, error: { code: 'RESET_UNAVAILABLE', message: 'Password reset is not available yet' }, requestId: req.id });
});

export const authRouter = router;
