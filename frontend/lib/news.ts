import { cache } from "react";
import { validSlug, newsQuery } from "./news-seo";
export type NewsSummary = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  updatedAt: string;
  category: { slug: string; name: string };
  cover: { id: string; alt: string; caption: string } | null;
};
export type NewsList = {
  items: NewsSummary[];
  total: number;
  page: number;
  limit: number;
  category: { name: string; slug: string } | null;
};
export type NewsArticle = NewsSummary & { bodyHtml: string };
async function publicFetch<T>(
  path: string,
  cached: boolean,
): Promise<T | null> {
  const response = await fetch(
    `${process.env.API_INTERNAL_URL ?? "http://localhost:4000"}/api/v1/public/news${path}`,
    {
      ...(cached
        ? { next: { revalidate: 60, tags: ["news"] } }
        : { cache: "no-store" as const }),
      signal: AbortSignal.timeout(5000),
    },
  );
  if (response.status === 404) return null;
  if (!response.ok)
    throw new Error(
      "Informasi berita sementara tidak dapat dimuat. Silakan coba lagi.",
    );
  const body = await response.json();
  if (body.success !== true) throw new Error("Respons berita tidak valid");
  return body.data as T;
}
export const getArticle = cache(async (slug: string) =>
  validSlug(slug)
    ? publicFetch<{ news: NewsArticle; related: NewsSummary[] }>(
        `/articles/${slug}`,
        false,
      )
    : null,
);
export const getNewsList = (
  page = 1,
  search = "",
  category?: string,
  limit = 9,
) =>
  publicFetch<NewsList>(
    `?${newsQuery(page, search, category, limit)}`,
    !search,
  );
export async function getCategories(cached = true) {
  return (
    (
      await publicFetch<{ items: { name: string; slug: string }[] }>(
        "/categories",
        cached,
      )
    )?.items ?? []
  );
}
export async function getNewsIndex() {
  return (
    (
      await publicFetch<{ items: { slug: string; updatedAt: string }[] }>(
        "/sitemap",
        false,
      )
    )?.items ?? []
  );
}
export const coverImage = (
  news: NewsSummary,
  variant: "thumb" | "display" = "display",
) =>
  news.cover
    ? `/api/v1/public/media/${news.cover.id}?variant=${variant}`
    : "/images/watundehoa/berita-default.jpg";
