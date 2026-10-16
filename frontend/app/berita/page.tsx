import type { Metadata } from "next";
import {
  NewsListPage,
  type NewsSearch,
  parseNewsSearch,
} from "@/features/news/list-page";
import { absoluteUrl } from "@/lib/news-seo";
import { getSiteSettings } from "@/lib/site-settings";
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<NewsSearch>;
}): Promise<Metadata> {
  const filter = parseNewsSearch(await searchParams);
  const settings = await getSiteSettings();
  return {
    title: `Berita ${settings.name}`,
    description: `Berita dan kegiatan resmi ${settings.name}.`,
    alternates: {
      canonical: absoluteUrl(
        filter && filter.page > 1 ? `/berita?page=${filter.page}` : "/berita",
      ),
    },
    robots: { index: !!filter && !filter.search, follow: true },
  };
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<NewsSearch>;
}) {
  return <NewsListPage query={await searchParams} />;
}
