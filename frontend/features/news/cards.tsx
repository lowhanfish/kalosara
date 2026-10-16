import Image from "next/image";
import Link from "next/link";
import { articlePath, categoryPath, newsDate } from "@/lib/news-seo";
import { coverImage, type NewsSummary } from "@/lib/news";
export function NewsCards({ items }: { items: NewsSummary[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((news) => (
        <article
          key={news.slug}
          className="min-w-0 overflow-hidden rounded-xl border border-border bg-white"
        >
          <Link href={articlePath(news.slug)} className="block">
            <Image
              src={coverImage(news, "thumb")}
              alt={
                news.cover?.alt ?? "Foto kantor kelurahan sebagai gambar bawaan"
              }
              width={480}
              height={270}
              unoptimized
              className="aspect-video w-full object-cover"
            />
          </Link>
          <div className="p-5">
            <Link
              className="text-xs font-semibold text-primary underline"
              href={categoryPath(news.category.slug)}
            >
              {news.category.name}
            </Link>
            <h2 className="mt-3 break-words text-xl font-bold">
              <Link href={articlePath(news.slug)}>{news.title}</Link>
            </h2>
            <time
              className="mt-3 block text-xs text-muted"
              dateTime={news.publishedAt}
            >
              {newsDate(news.publishedAt)}
            </time>
            <p className="mt-3 break-words text-sm leading-7 text-muted">
              {news.excerpt}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
