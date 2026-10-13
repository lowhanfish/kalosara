import type { Request, RequestHandler } from 'express';
import type { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

export type Principal = { id: string; role: Role; isActive: boolean };

export class AccessError extends Error {
  constructor(public readonly status: 401 | 403, public readonly code: string, message: string) {
    super(message);
  }
}

export function assertActive(principal: Principal | null | undefined): Principal {
  if (!principal) throw new AccessError(401, 'UNAUTHENTICATED', 'Authentication required');
  if (!principal.isActive) throw new AccessError(403, 'ACCOUNT_INACTIVE', 'Account is inactive');
  return principal;
}

export function assertRole(principal: Principal | null | undefined, allowed: readonly Role[]): Principal {
  const active = assertActive(principal);
  if (!allowed.includes(active.role)) throw new AccessError(403, 'FORBIDDEN', 'Insufficient permission');
  return active;
}

export function assertOwner(principal: Principal | null | undefined, ownerId: string | null | undefined): Principal {
  const active = assertActive(principal);
  if (!ownerId || active.id !== ownerId) throw new AccessError(403, 'FORBIDDEN', 'Resource access denied');
  return active;
}

// A verified auth middleware in Prompt 03 will set req.auth. Never populate it from raw request fields.
export const loadActivePrincipal: RequestHandler = async (req, res, next) => {
  const userId = req.auth?.userId;
  if (!userId || !z.uuid().safeParse(userId).success) return next(new AccessError(401, 'UNAUTHENTICATED', 'Authentication required'));
  try {
    const principal = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true },
    });
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

export function requireOwnership(ownerIdOf: (req: Request) => string | null | undefined | Promise<string | null | undefined>): RequestHandler {
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
