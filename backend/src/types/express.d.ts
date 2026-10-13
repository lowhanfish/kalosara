import type { Principal } from '../modules/auth/authorization.js';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: { userId: string; sessionId: string };
  }
  interface Locals {
    principal?: Principal;
  }
}
