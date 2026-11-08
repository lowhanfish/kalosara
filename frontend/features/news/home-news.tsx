import { SkeletonImage } from "@/components/ui/skeleton-image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { getNewsList, coverImage } from "@/lib/news";
import { articlePath, newsDate } from "@/lib/news-seo";
export async function HomeNews() {
  let data;
  try {
    data = await getNewsList(1, "", undefined, 6);
  } catch {
    return (
      <EmptyState
        title="Berita belum dapat dimuat"
        description="Silakan muat ulang halaman beberapa saat lagi."
      />
    );
  }
  const [featured, ...items] = data?.items ?? [];
  if (!featured)
    return (
      <EmptyState
        title="Kabar baru segera hadir"
        description="Berita dan cerita kegiatan kelurahan akan ditampilkan di sini setelah diterbitkan."
      />
    );
  return (
    <div className="grid gap-5 sm:grid-cols-[1.1fr_1fr]">
      <Link
        href={articlePath(featured.slug)}
        className="portal-card group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <SkeletonImage
            src={coverImage(featured, "display")}
            alt={featured.cover?.alt ?? "Kantor kelurahan"}
            fill
            unoptimized
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width:640px) 100vw, 35vw"
          />
        </div>
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <time
            dateTime={featured.publishedAt}
            className="text-xs font-medium text-slate-400"
          >
            {newsDate(featured.publishedAt)}
          </time>
          <h3 className="mt-2 text-lg font-bold leading-snug text-primary transition-colors group-hover:text-primary">
            {featured.title}
          </h3>
          <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-muted">
            {featured.excerpt}
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            Baca selengkapnya
            <ArrowUpRight
              size={15}
              className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </Link>
      <div className="home-news-compact flex flex-col justify-between gap-2">
        {items.map((news, index) => (
          <Link
            key={news.slug}
            href={articlePath(news.slug)}
            className={`portal-card group items-start gap-3 rounded-2xl border border-slate-200/90 bg-white p-2 sm:p-2.5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md ${
              index >= 3 ? "hidden sm:flex" : "flex"
            }`}
          >
            <div className="relative aspect-square size-11 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:size-12">
              <SkeletonImage
                src={coverImage(news, "display")}
                alt={news.cover?.alt ?? "Kantor kelurahan"}
                fill
                unoptimized
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              />
            </div>
            <div className="min-w-0 flex-1">
              <time
                className="!text-[9.5px] font-medium text-slate-400"
                dateTime={news.publishedAt}
              >
                {newsDate(news.publishedAt)}
              </time>
              <h3 className="mt-0.5 line-clamp-2 !text-[11px] sm:!text-[11.5px] font-semibold !leading-snug text-primary transition-colors group-hover:text-primary">
                {news.title}
              </h3>
            </div>
            <ArrowUpRight
              size={12}
              className="mt-0.5 shrink-0 text-slate-300 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
