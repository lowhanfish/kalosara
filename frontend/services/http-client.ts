export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public requestId: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type RequestOptions = Omit<RequestInit, "credentials" | "signal"> & {
  signal?: AbortSignal;
  timeoutMs?: number;
};

export function createHttpClient(fetcher: typeof fetch = fetch) {
  return async function request<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    if (!path.startsWith("/") || path.startsWith("//"))
      throw new Error("API path must be relative to this origin");
    const { signal, timeoutMs = 10_000, ...init } = options;
    const controller = new AbortController();
    let timedOut = false;
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    let requestId = crypto.randomUUID() as string;
    try {
      const headers = new Headers(init.headers);
      headers.set("X-Request-Id", requestId);
      const response = await fetcher(`/api/v1${path}`, {
        ...init,
        headers,
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
      });
      requestId = response.headers.get("X-Request-Id") ?? requestId;
      const body = await response.json().catch(() => null);
      requestId =
        typeof body?.requestId === "string" ? body.requestId : requestId;
      if (!response.ok)
        throw new ApiError(
          response.status,
          body?.error?.code ?? "HTTP_ERROR",
          body?.error?.message ?? "Permintaan gagal",
          requestId,
        );
      if (body?.success !== true || !("data" in body))
        throw new ApiError(
          response.status,
          "INVALID_RESPONSE",
          "Respons server tidak valid",
          requestId,
        );
      return body.data as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        0,
        timedOut
          ? "TIMEOUT"
          : controller.signal.aborted
            ? "ABORTED"
            : "NETWORK_ERROR",
        "Tidak dapat menyelesaikan permintaan",
        requestId,
      );
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    }
  };
}
