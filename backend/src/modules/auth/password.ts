import { compare, hash } from 'bcryptjs';
import { env } from '../../config/env.js';

export function hashPassword(password: string): Promise<string> {
  return hash(password, env.PASSWORD_BCRYPT_COST);
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash);
}
