import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle, coverImage } from "@/lib/news";
import {
  absoluteUrl,
  articlePath,
  categoryPath,
  jsonLd,
  newsDate,
} from "@/lib/news-seo";
import { getSiteSettings } from "@/lib/site-settings";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { NewsCards } from "@/features/news/cards";
import { ArticleShare } from "@/features/news/share";
import "@/features/news/news.css";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getArticle(slug);
  if (!data) notFound();
  const settings = await getSiteSettings();
  const news = data.news;
  const url = absoluteUrl(articlePath(news.slug));
  const image = absoluteUrl(coverImage(news));
  return {
    title: news.title,
    description: news.excerpt,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title: news.title,
      description: news.excerpt,
      url,
      type: "article",
      siteName: settings.name,
      locale: "id_ID",
      publishedTime: news.publishedAt,
      modifiedTime: news.updatedAt,
      images: [
        { url: image, alt: news.cover?.alt ?? `Portal ${settings.name}` },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: news.title,
      description: news.excerpt,
      images: [image],
    },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getArticle(slug);
  if (!data) notFound();
  const settings = await getSiteSettings();
  const news = data.news;
  const url = absoluteUrl(articlePath(news.slug));
  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: news.title,
      description: news.excerpt,
      datePublished: news.publishedAt,
      dateModified: news.updatedAt,
      image: [absoluteUrl(coverImage(news))],
      mainEntityOfPage: url,
      author: { "@type": "Organization", name: settings.name },
      publisher: {
        "@type": "GovernmentOrganization",
        name: settings.name,
        ...(settings.logoUrl
          ? {
              logo: {
                "@type": "ImageObject",
                url: absoluteUrl(settings.logoUrl),
              },
            }
          : {}),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { name: "Beranda", item: absoluteUrl("/") },
        { name: "Berita", item: absoluteUrl("/berita") },
        { name: news.title, item: url },
      ].map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        ...item,
      })),
    },
  ];
  return (
    <main id="konten" tabIndex={-1} className="container pb-16">
      <Breadcrumb
        items={[
          { label: "Beranda", href: "/" },
          { label: "Berita", href: "/berita" },
          { label: news.title },
        ]}
      />
      <article className="mx-auto max-w-3xl py-7">
        <Link
          href={categoryPath(news.category.slug)}
          className="text-sm font-semibold text-primary underline"
        >
          {news.category.name}
        </Link>
        <h1 className="display-title mt-4 break-words text-3xl leading-tight sm:text-5xl">
          {news.title}
        </h1>
        <p className="mt-5 text-sm text-muted">
          {settings.name} ·{" "}
          <time dateTime={news.publishedAt}>{newsDate(news.publishedAt)}</time>
        </p>
        <p className="mt-6 break-words text-lg leading-8 text-muted">
          {news.excerpt}
        </p>
        <figure className="mt-7">
          <Image
            src={coverImage(news)}
            width={1200}
            height={675}
            alt={
              news.cover?.alt ?? "Foto kantor kelurahan sebagai gambar bawaan"
            }
            unoptimized
            preload
            className="h-auto w-full rounded-xl"
          />
          {news.cover?.caption && (
            <figcaption className="mt-3 text-sm text-muted">
              {news.cover.caption}
            </figcaption>
          )}
        </figure>
        <div
          className="news-body mt-8"
          dangerouslySetInnerHTML={{ __html: news.bodyHtml }}
        />
        <div className="mt-8 border-t border-border pt-6">
          <ArticleShare url={url} title={news.title} />
        </div>
      </article>
      {data.related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-6 text-2xl font-semibold">Berita terkait</h2>
          <NewsCards items={data.related} />
        </section>
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structured) }}
      />
    </main>
  );
}
