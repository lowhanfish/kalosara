import {
  createHttpClient,
  ApiError,
  type RequestOptions,
} from "@/services/http-client";
const http = createHttpClient();
export type CmsRequest = <T>(
  path: string,
  options?: RequestOptions,
) => Promise<T>;
export async function cmsMutate<T>(
  request: CmsRequest,
  path: string,
  body: unknown,
  method = "PUT",
) {
  await request("/auth/me");
  const { csrfToken } = await http<{ csrfToken: string }>("/auth/csrf");
  return request<T>(path, {
    method,
    headers: {
      "X-CSRF-Token": csrfToken,
      ...(body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
    },
    body: body instanceof FormData ? body : JSON.stringify(body),
    timeoutMs: 60000,
  });
}
export function cmsError(error: unknown) {
  return error instanceof ApiError
    ? `${error.code === "VALIDATION_ERROR" ? "Periksa isian dan batas panjangnya." : error.message} (${error.code}; ${error.requestId})`
    : "Permintaan gagal. Coba lagi.";
}
export type MediaAsset = {
  id: string;
  url: string | null;
  mimeType: string;
  originalName: string;
  alt: string;
  caption: string;
  visibility: "PUBLIC" | "PRIVATE";
  size: number;
  archived: boolean;
};
export type Category = {
  id: string;
  name: string;
  slug: string;
  archived: boolean;
};
export type News = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  categoryId: string;
  coverId: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  version: number;
};
export type List<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};
