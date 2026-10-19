import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Calendar } from "lucide-react";
import { articlePath, categoryPath, newsDate } from "@/lib/news-seo";
import { coverImage, type NewsSummary } from "@/lib/news";

export function NewsCards({ items }: { items: NewsSummary[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((news) => (
        <article
          key={news.slug}
          className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50"
        >
          <Link
            href={articlePath(news.slug)}
            className="relative aspect-video w-full overflow-hidden bg-slate-100"
          >
            <Image
              src={coverImage(news, "display")}
              alt={
                news.cover?.alt ?? "Foto kantor kelurahan sebagai gambar bawaan"
              }
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </Link>
          <div className="flex flex-1 flex-col p-6">
            <div className="flex items-center justify-between gap-3">
              <Link
                className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white"
                href={categoryPath(news.category.slug)}
              >
                {news.category.name}
              </Link>
              <time
                className="flex items-center gap-1.5 text-xs text-slate-400"
                dateTime={news.publishedAt}
              >
                <Calendar size={12} />
                {newsDate(news.publishedAt)}
              </time>
            </div>

            <h2 className="mt-3.5 break-words text-lg font-bold leading-snug text-primary transition-colors group-hover:text-primary">
              <Link href={articlePath(news.slug)} className="flex items-start justify-between gap-2">
                <span>{news.title}</span>
                <ArrowUpRight size={16} className="mt-1 shrink-0 text-slate-300 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            </h2>

            <p className="mt-2.5 line-clamp-3 break-words text-sm leading-6 text-muted">
              {news.excerpt}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

