import { QueryClient } from "@tanstack/react-query";
import { createAuthStore, type AuthUser } from "../../store/auth-store";
import {
  ApiError,
  createHttpClient,
  type RequestOptions,
} from "../../services/http-client";

export const userQueryKey = (userId: string, ...parts: readonly unknown[]) =>
  ["user", userId, ...parts] as const;
const definitive = (e: unknown) =>
  e instanceof ApiError &&
  ((e.status === 401 &&
    ["UNAUTHENTICATED", "TOKEN_EXPIRED", "SESSION_REVOKED"].includes(e.code)) ||
    (e.status === 403 && e.code === "ACCOUNT_INACTIVE"));

// One runtime per mounted provider: never share server-rendered users across requests.
export function createAuthRuntime(
  fetcher: typeof fetch = fetch,
  redirect: (error?: ApiError, hadIdentity?: boolean) => void = () => {},
) {
  const store = createAuthStore();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  const http = createHttpClient(fetcher);
  let generation = 0;
  let identityVersion = 0;
  let refreshFlight: Promise<void> | undefined;
  let lastRefresh: { generation: number; promise: Promise<void> } | undefined;
  let bootstrapFlight: Promise<void> | undefined;
  let invalid = false;

  function guest(error?: unknown) {
    if (invalid) return;
    const hadIdentity = store.getState().user !== null;
    invalid = true;
    identityVersion++;
    generation++;
    queryClient.clear(); // Cancels queries before a new identity can render.
    store.setState({ status: "GUEST", user: null, error: null });
    redirect(error instanceof ApiError ? error : undefined, hadIdentity);
  }
  function temporary(error: unknown) {
    if (
      error instanceof ApiError &&
      !["ABORTED", "STALE_SESSION"].includes(error.code) &&
      !invalid
    )
      store.setState({ status: "TEMPORARY_ERROR", error });
  }
  async function refresh() {
    const started = generation;
    if (!refreshFlight) {
      refreshFlight = (async () => {
        try {
          const { csrfToken } = await http<{ csrfToken: string }>("/auth/csrf");
          await http("/auth/refresh", {
            method: "POST",
            headers: { "X-CSRF-Token": csrfToken },
          });
          generation++;
        } catch (error) {
          generation++;
          if (definitive(error)) guest(error);
          else temporary(error);
          throw error;
        }
      })().finally(() => {
        refreshFlight = undefined;
      });
      lastRefresh = { generation: started, promise: refreshFlight };
    }
    return refreshFlight;
  }
  async function request<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    if (path.startsWith("/auth/") && path !== "/auth/me")
      return http<T>(path, options); // Auth mutations must never be replayed.
    return authenticated<T>(path, options);
  }
  async function authenticated<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const started = generation;
    const identity = identityVersion;
    const ensureCurrent = () => {
      if (identity !== identityVersion)
        throw new ApiError(
          0,
          "STALE_SESSION",
          "Identitas sesi telah berubah",
          "",
        );
    };
    try {
      const data = await http<T>(path, options);
      ensureCurrent();
      return data;
    } catch (error) {
      ensureCurrent();
      if (
        !(error instanceof ApiError) ||
        error.status !== 401 ||
        !["TOKEN_EXPIRED", "UNAUTHENTICATED"].includes(error.code)
      ) {
        if (definitive(error)) guest(error);
        else if (
          path === "/auth/me" ||
          !(error instanceof ApiError) ||
          error.status === 0 ||
          error.status >= 500
        )
          temporary(error);
        throw error;
      }
      if (invalid) throw error;
      // A late 401 from the old access cookie uses the completed rotation.
      if (lastRefresh?.generation === started) await lastRefresh.promise;
      else if (refreshFlight) await refreshFlight;
      else if (started === generation) await refresh();
      ensureCurrent();
      if (options.signal?.aborted)
        throw new ApiError(
          0,
          "ABORTED",
          "Permintaan dibatalkan",
          error.requestId,
        );
      try {
        const data = await http<T>(path, options);
        ensureCurrent();
        return data;
      } catch (retryError) {
        ensureCurrent();
        if (definitive(retryError)) guest(retryError);
        else if (
          path === "/auth/me" ||
          !(retryError instanceof ApiError) ||
          retryError.status === 0 ||
          retryError.status >= 500
        )
          temporary(retryError);
        throw retryError;
      }
    }
  }
  function bootstrap(): Promise<void> {
    if (bootstrapFlight) return bootstrapFlight;
    invalid = false;
    store.setState({ status: "INITIALIZING", error: null });
    bootstrapFlight = (async () => {
      try {
        const { user } = await authenticated<{ user: AuthUser }>("/auth/me");
        if (invalid) return;
        // Never expose an old identity's cache when cookies changed in another tab.
        if (store.getState().user?.id !== user.id) {
          identityVersion++;
          queryClient.clear();
        }
        store.setState({
          status: "AUTHENTICATED",
          user: { id: user.id, role: user.role },
          error: null,
        });
      } catch (error) {
        if (definitive(error)) guest(error);
        else temporary(error);
      }
    })().finally(() => {
      bootstrapFlight = undefined;
    });
    return bootstrapFlight;
  }
  async function logout() {
    const { csrfToken } = await http<{ csrfToken: string }>("/auth/csrf");
    await http("/auth/logout", {
      method: "POST",
      headers: { "X-CSRF-Token": csrfToken },
    });
    guest();
  }
  return { store, queryClient, request, bootstrap, logout };
}
