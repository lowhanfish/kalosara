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
  if (!(error instanceof ApiError))
    return "Permintaan gagal. Silakan coba lagi.";
  const messages: Record<string, string> = {
    UNAUTHENTICATED:
      "Email atau kata sandi salah. Periksa kembali lalu coba lagi.",
    VALIDATION_ERROR: "Periksa kembali isian Anda dan batas panjangnya.",
    RATE_LIMITED:
      "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.",
    ACCOUNT_INACTIVE: "Akun belum aktif. Hubungi pengelola kelurahan.",
    NETWORK_ERROR:
      "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.",
    TIMEOUT: "Server belum merespons. Silakan coba lagi.",
    ORIGIN_FORBIDDEN:
      "Alamat website belum sesuai konfigurasi server. Hubungi pengelola.",
  };
  return (
    messages[error.code] ??
    (error.status >= 500
      ? "Terjadi gangguan pada server. Silakan coba lagi nanti."
      : "Permintaan belum berhasil. Periksa isian atau muat ulang halaman.")
  );
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
