import { NextRequest, NextResponse } from "next/server";
import { validSlug, newsQuery, siteOrigin, articlePath } from "./lib/news-seo";
function missing(request: NextRequest) {
  const target = request.nextUrl.clone();
  target.pathname = "/berita-tidak-ditemukan";
  target.search = "";
  const response = NextResponse.rewrite(target, { status: 404 });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}
function unavailable() {
  return new NextResponse(
    '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Berita sementara tidak tersedia | KALOSARA</title></head><body style="margin:0;background:#f7fafc;color:#032545;font-family:system-ui,sans-serif"><main style="max-width:42rem;margin:12vh auto;padding:2rem"><p>KALOSARA</p><h1>Berita sementara tidak tersedia</h1><p>Informasi belum dapat dimuat. Silakan coba lagi beberapa saat lagi.</p><p><a href="/berita">Coba kembali</a> · <a href="/">Beranda</a></p></main></body></html>',
    {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": "60",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}
// Check publication before streaming/global loading can commit HTTP 200.
// Next permanentRedirect uses 308; the publication contract explicitly requires 301.
export async function proxy(request: NextRequest) {
  const parts = request.nextUrl.pathname.split("/").filter(Boolean);
  const page = Number(request.nextUrl.searchParams.get("page") ?? 1);
  if (!Number.isInteger(page) || page < 1 || page > 100000)
    return missing(request);
  const article = parts.length === 2;
  const category = parts.length === 3 && parts[1] === "kategori";
  if (!article && !category && parts.length !== 1) return NextResponse.next();
  const slug = category ? parts[2] : parts[1];
  if ((article || category) && !validSlug(slug)) return missing(request);
  const base = `${process.env.API_INTERNAL_URL ?? "http://localhost:4000"}/api/v1/public/news`;
  try {
    if (article || category) {
      const response = await fetch(
        `${base}/${article ? "resolve" : "resolve-category"}/${slug}`,
        { cache: "no-store", signal: AbortSignal.timeout(3000) },
      );
      if (response.status === 404) return missing(request);
      if (!response.ok) return unavailable();
      if (response.ok && article) {
        const body = await response.json();
        const canonical = body.data?.slug;
        if (
          body.success === true &&
          typeof canonical === "string" &&
          validSlug(canonical) &&
          canonical !== slug
        ) {
          const target = new URL(articlePath(canonical), siteOrigin());
          const redirect = NextResponse.redirect(target, 301);
          redirect.headers.set("Cache-Control", "no-store");
          return redirect;
        }
      }
    }
    if (!article && page > 1) {
      const search = (request.nextUrl.searchParams.get("q") ?? "")
        .trim()
        .slice(0, 100);
      const response = await fetch(
        `${base}?${newsQuery(page, search, category ? slug : undefined)}`,
        { cache: "no-store", signal: AbortSignal.timeout(3000) },
      );
      if (response.status === 404) return missing(request);
      if (!response.ok) return unavailable();
      if (response.ok && !(await response.json()).data?.items?.length)
        return missing(request);
    }
  } catch {
    return unavailable();
  }
  return NextResponse.next();
}
export const config = { matcher: ["/berita/:path*"] };
