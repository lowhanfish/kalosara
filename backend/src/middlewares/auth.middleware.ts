import type { Request, RequestHandler } from 'express';
import type { Role } from '@prisma/client';
import { z } from 'zod';
import {
  assertActive,
  assertOwner,
  assertRole,
  type Principal,
} from '../lib/authorization.js';
import { AccessError } from '../lib/errors.js';
import {
  findPrincipalById,
  findRefreshSessionById,
} from '../repositories/auth.repository.js';
import {
  ACCESS_COOKIE,
  validateMutation,
  verifyAccessToken,
} from '../services/auth.service.js';

export { AccessError, assertActive, assertOwner, assertRole, type Principal };

export const requireMutation: RequestHandler = (req, _res, next) => {
  try {
    validateMutation(req);
    next();
  } catch (error) {
    next(error);
  }
};

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const raw = req.cookies?.[ACCESS_COOKIE];
    if (typeof raw !== 'string') {
      throw new AccessError(401, 'UNAUTHENTICATED', 'Access token required');
    }
    const claims = await verifyAccessToken(raw);
    const session = await findRefreshSessionById(claims.sessionId);
    if (
      !session ||
      session.userId !== claims.userId ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    ) {
      throw new AccessError(401, 'SESSION_REVOKED', 'Session revoked');
    }
    req.auth = claims;
    next();
  } catch (error) {
    next(error);
  }
};

// req.auth is populated only after signature and database session verification.
export const loadActivePrincipal: RequestHandler = async (req, res, next) => {
  const userId = req.auth?.userId;
  if (!userId || !z.uuid().safeParse(userId).success) {
    return next(
      new AccessError(401, 'UNAUTHENTICATED', 'Authentication required'),
    );
  }
  try {
    const principal = await findPrincipalById(userId);
    res.locals.principal = assertActive(principal);
    next();
  } catch (error) {
    next(error);
  }
};

export function requireRoles(...roles: Role[]): RequestHandler {
  return (_req, res, next) => {
    try {
      assertRole(res.locals.principal, roles);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireOwnership(
  ownerIdOf: (
    req: Request,
  ) => string | null | undefined | Promise<string | null | undefined>,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const ownerId = await ownerIdOf(req);
      assertOwner(res.locals.principal, ownerId);
      next();
    } catch (error) {
      next(error);
    }
  };
}
