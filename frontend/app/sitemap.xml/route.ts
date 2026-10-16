import { getCategories, getNewsIndex } from "@/lib/news";
import {
  absoluteUrl,
  articlePath,
  categoryPath,
  xmlText,
} from "@/lib/news-seo";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const [items, categories] = await Promise.all([
      getNewsIndex(),
      getCategories(false),
    ]);
    const urls = [
      ...["/", "/profil", "/berita", "/kontak", "/pelayanan"].map((path) => ({
        path,
        updatedAt: null as string | null,
      })),
      ...categories.map((category) => ({
        path: categoryPath(category.slug),
        updatedAt: null,
      })),
      ...items.map((news) => ({
        path: articlePath(news.slug),
        updatedAt: news.updatedAt,
      })),
    ];
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((item) => `<url><loc>${xmlText(absoluteUrl(item.path))}</loc>${item.updatedAt ? `<lastmod>${xmlText(item.updatedAt)}</lastmod>` : ""}</url>`).join("")}</urlset>`,
      {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return new Response("Sitemap sementara tidak tersedia", {
      status: 503,
      headers: { "Retry-After": "60" },
    });
  }
}
