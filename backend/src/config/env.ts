import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  PASSWORD_BCRYPT_COST: z.coerce.number().int().min(12).max(14).default(12),
  APP_ORIGIN: z.url().refine((value) => new URL(value).origin === value, 'APP_ORIGIN must be an origin without a path or trailing slash').default('http://localhost:3000'),
  UPLOAD_ROOT: z.string().min(1).default('public/uploads'),
  FRONTEND_INTERNAL_URL: z.url().refine(value => ['http:', 'https:'].includes(new URL(value).protocol) && new URL(value).origin === value, 'FRONTEND_INTERNAL_URL must be an HTTP(S) origin').default('http://localhost:3000'),
  CACHE_INVALIDATION_SECRET: z.string().min(32).optional(),
  AUTH_SIGNING_KEYS: z.string().optional(),
});

export const env = envSchema.parse(process.env);
if (env.NODE_ENV === 'production' && !env.AUTH_SIGNING_KEYS) {
  throw new Error('AUTH_SIGNING_KEYS is required in production');
}

if (env.NODE_ENV === 'production' && !env.CACHE_INVALIDATION_SECRET) {
  throw new Error('CACHE_INVALIDATION_SECRET is required in production');
}
