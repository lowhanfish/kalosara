import { describe, expect, it, vi } from 'vitest';
import { Role } from '@prisma/client';
import { AccessError, assertActive, assertOwner, assertRole } from '../modules/auth/authorization.js';
import { registerPublicAccount, type PublicAccountRepository } from '../modules/auth/register-public.js';

describe('public registration policy', () => {
  it('forces MASYARAKAT even when the client sends a privileged role', async () => {
    const create = vi.fn<PublicAccountRepository['create']>().mockResolvedValue({
      id: 'dummy-id', email: 'warga@example.invalid', role: 'MASYARAKAT',
    });
    const result = await registerPublicAccount(
      { email: ' WARGA@EXAMPLE.INVALID ', password: 'long-dummy-password', role: 'LURAH', displayName: 'Warga Contoh' },
      { repository: { create }, hash: async () => 'bcrypt-hash' },
    );
    expect(create).toHaveBeenCalledWith({
      email: 'warga@example.invalid',
      phone: undefined,
      passwordHash: 'bcrypt-hash',
      role: 'MASYARAKAT',
      displayName: 'Warga Contoh',
    });
    expect(result.role).toBe('MASYARAKAT');
  });

  it('rejects passwords that bcrypt would truncate', async () => {
    const create = vi.fn<PublicAccountRepository['create']>();
    await expect(registerPublicAccount(
      { email: 'warga@example.invalid', password: 'a'.repeat(73), role: 'ADMIN_KELURAHAN' },
      { repository: { create }, hash: async () => 'unused' },
    )).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });
});

describe('authorization policy', () => {
  const citizen = { id: 'user-a', role: Role.MASYARAKAT, isActive: true };
  it('denies missing and inactive accounts', () => {
    expect(() => assertActive(null)).toThrowError(AccessError);
    expect(() => assertActive({ ...citizen, isActive: false })).toThrowError(expect.objectContaining({ code: 'ACCOUNT_INACTIVE' }));
  });

  it('enforces roles and resource ownership', () => {
    expect(() => assertRole(citizen, [Role.ADMIN_KELURAHAN])).toThrowError(expect.objectContaining({ code: 'FORBIDDEN' }));
    expect(() => assertOwner(citizen, 'user-b')).toThrowError(expect.objectContaining({ code: 'FORBIDDEN' }));
    expect(assertOwner(citizen, 'user-a')).toBe(citizen);
  });
});
