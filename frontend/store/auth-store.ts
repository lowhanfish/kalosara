import { createStore } from "zustand/vanilla";
import type { ApiError } from "../services/http-client";

export type AuthUser = {
  id: string;
  role: "LURAH" | "ADMIN_KELURAHAN" | "MASYARAKAT";
};
export type AuthStatus =
  "INITIALIZING" | "AUTHENTICATED" | "GUEST" | "TEMPORARY_ERROR";
export type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  error: ApiError | null;
};
export const createAuthStore = () =>
  createStore<AuthState>(() => ({
    status: "INITIALIZING",
    user: null,
    error: null,
  }));
