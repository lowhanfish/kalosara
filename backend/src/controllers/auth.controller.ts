import { Prisma } from '@prisma/client';
import type { RequestHandler } from 'express';
import { AccessError } from '../lib/errors.js';
import { sendSuccess } from '../lib/http-response.js';
import {
  clearSessionCookies,
  getCurrentAuthenticatedUser,
  issueCsrf,
  login,
  logout,
  logoutAll,
  REFRESH_COOKIE,
  refreshSession,
  registerPublicAccount,
  setSessionCookies,
} from '../services/auth.service.js';

export const getCsrfController: RequestHandler = (req, res) => {
  sendSuccess(res, req, { csrfToken: issueCsrf(res) });
};

export const registerPublicController: RequestHandler = async (req, res) => {
  try {
    const user = await registerPublicAccount(req.body);
    sendSuccess(res, req, { user }, 201);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new AccessError(409, 'ACCOUNT_EXISTS', 'Account already exists');
    }
    throw error;
  }
};

export const loginController: RequestHandler = async (req, res) => {
  const result = await login(req.body, req);
  setSessionCookies(res, result.access, result.refresh, result.expiresAt);
  sendSuccess(res, req, { user: result.user });
};

export const refreshSessionController: RequestHandler = async (req, res) => {
  const result = await refreshSession(req.cookies?.[REFRESH_COOKIE], req);
  setSessionCookies(res, result.access, result.refresh, result.expiresAt);
  sendSuccess(res, req, { refreshed: true });
};

export const logoutController: RequestHandler = async (req, res) => {
  await logout(req.cookies?.[REFRESH_COOKIE]);
  clearSessionCookies(res);
  sendSuccess(res, req, { loggedOut: true });
};

export const logoutAllController: RequestHandler = async (req, res) => {
  await logoutAll(req.auth!.userId);
  clearSessionCookies(res);
  sendSuccess(res, req, { loggedOut: true });
};

export const getAuthenticatedMeController: RequestHandler = async (
  req,
  res,
) => {
  const user = await getCurrentAuthenticatedUser(req.auth!.userId);
  sendSuccess(res, req, { user });
};

// Delivery and reset completion are reserved for a later prompt; this response never checks account existence.
export const forgotPasswordController: RequestHandler = (req, res) => {
  res.status(503).json({
    success: false,
    error: {
      code: 'RESET_UNAVAILABLE',
      message: 'Password reset is not available yet',
    },
    requestId: req.id,
  });
};
