import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  NewsListPage,
  type NewsSearch,
  parseNewsSearch,
} from "@/features/news/list-page";
import { getNewsList } from "@/lib/news";
import { absoluteUrl, categoryPath, validSlug } from "@/lib/news-seo";
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<NewsSearch>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!validSlug(slug)) notFound();
  const filter = parseNewsSearch(await searchParams);
  if (!filter) notFound();
  const data = await getNewsList(filter.page, filter.search, slug);
  if (!data) notFound();
  return {
    title: `Berita ${data.category?.name}`,
    description: `Berita kategori ${data.category?.name}.`,
    alternates: {
      canonical: absoluteUrl(
        categoryPath(slug) + (filter.page > 1 ? `?page=${filter.page}` : ""),
      ),
    },
    robots: { index: !filter.search, follow: true },
  };
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<NewsSearch>;
}) {
  const { slug } = await params;
  if (!validSlug(slug)) notFound();
  return <NewsListPage category={slug} query={await searchParams} />;
}
