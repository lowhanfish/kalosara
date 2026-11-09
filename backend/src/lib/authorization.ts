import type { Role } from '@prisma/client';
import { AccessError } from './errors.js';

export type Principal = { id: string; role: Role; isActive: boolean };

export function assertActive(principal: Principal | null | undefined): Principal {
  if (!principal) throw new AccessError(401, 'UNAUTHENTICATED', 'Authentication required');
  if (!principal.isActive) throw new AccessError(403, 'ACCOUNT_INACTIVE', 'Account is inactive');
  return principal;
}

export function assertRole(
  principal: Principal | null | undefined,
  allowed: readonly Role[],
): Principal {
  const active = assertActive(principal);
  if (!allowed.includes(active.role)) {
    throw new AccessError(403, 'FORBIDDEN', 'Insufficient permission');
  }
  return active;
}

export function assertOwner(
  principal: Principal | null | undefined,
  ownerId: string | null | undefined,
): Principal {
  const active = assertActive(principal);
  if (!ownerId || active.id !== ownerId) {
    throw new AccessError(403, 'FORBIDDEN', 'Resource access denied');
  }
  return active;
}
