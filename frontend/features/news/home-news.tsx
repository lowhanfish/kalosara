import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { getNewsList, coverImage } from "@/lib/news";
import { articlePath, newsDate } from "@/lib/news-seo";
export async function HomeNews() {
  let data;
  try {
    data = await getNewsList(1, "", undefined, 3);
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
        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={coverImage(featured, "thumb")}
            alt={featured.cover?.alt ?? "Kantor kelurahan"}
            fill
            unoptimized
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width:640px) 100vw, 35vw"
          />
        </div>
        <div className="p-5">
          <time
            dateTime={featured.publishedAt}
            className="text-[10px] text-slate-500"
          >
            {newsDate(featured.publishedAt)}
          </time>
          <h3 className="mt-2 text-lg font-bold leading-7 text-primary">
            {featured.title}
          </h3>
          <p className="mt-3 line-clamp-3 text-xs leading-6 text-muted">
            {featured.excerpt}
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-primary">
            Baca selengkapnya
            <ArrowUpRight size={14} />
          </span>
        </div>
      </Link>
      <div className="space-y-4">
        {items.map((news) => (
          <Link
            key={news.slug}
            href={articlePath(news.slug)}
            className="group block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300"
          >
            <Image
              src={coverImage(news, "thumb")}
              alt={news.cover?.alt ?? "Kantor kelurahan"}
              width={360}
              height={180}
              unoptimized
              className="mb-3 aspect-[2/1] w-full rounded-lg object-cover"
            />
            <time
              className="text-[10px] text-slate-500"
              dateTime={news.publishedAt}
            >
              {newsDate(news.publishedAt)}
            </time>
            <h3 className="mt-2 text-sm font-semibold leading-6 text-primary">
              {news.title}
            </h3>
          </Link>
        ))}
      </div>
    </div>
  );
}
