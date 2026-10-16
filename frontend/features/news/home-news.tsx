import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { getNewsList, coverImage } from "@/lib/news";
import { articlePath, newsDate } from "@/lib/news-seo";
export async function HomeNews() {
  let data;
  try {
    data = await getNewsList(1, "", undefined, 5);
  } catch {
    return (
      <EmptyState
        title="Berita sementara tidak tersedia"
        description="Silakan muat ulang halaman beberapa saat lagi."
      />
    );
  }
  const [featured, ...items] = data?.items ?? [];
  if (!featured)
    return (
      <EmptyState
        title="Belum ada berita yang dipublikasikan"
        description="Berita resmi akan tampil setelah diterbitkan oleh pengelola kelurahan."
      />
    );
  const date = new Date(featured.publishedAt);
  return (
    <div className="news-content">
      <Link
        href={articlePath(featured.slug)}
        className="reference-news-feature"
      >
        <div className="reference-news-photo">
          <Image
            src={coverImage(featured, "thumb")}
            alt={
              featured.cover?.alt ??
              "Foto kantor kelurahan sebagai gambar bawaan"
            }
            fill
            unoptimized
            className="object-cover"
            sizes="40vw"
          />
        </div>
        <div className="reference-news-title">
          <span className="reference-date-box">
            <b>
              {new Intl.DateTimeFormat("id-ID", {
                day: "2-digit",
                timeZone: "Asia/Makassar",
              }).format(date)}
            </b>
            <small>
              {new Intl.DateTimeFormat("id-ID", {
                month: "short",
                year: "numeric",
                timeZone: "Asia/Makassar",
              }).format(date)}
            </small>
          </span>
          <h3>{featured.title}</h3>
          <span className="round-arrow">
            <ArrowRight aria-hidden="true" size={17} />
          </span>
        </div>
        <p>{featured.excerpt}</p>
      </Link>
      <div className="reference-news-list">
        {items.map((news) => (
          <Link key={news.slug} href={articlePath(news.slug)}>
            <Image
              src={coverImage(news, "thumb")}
              alt={
                news.cover?.alt ?? "Foto kantor kelurahan sebagai gambar bawaan"
              }
              width={90}
              height={60}
              unoptimized
              className="object-cover"
            />
            <span>
              <time dateTime={news.publishedAt}>
                {newsDate(news.publishedAt)}
              </time>
              <h3>{news.title}</h3>
            </span>
            <ArrowRight aria-hidden="true" size={14} />
          </Link>
        ))}
      </div>
    </div>
  );
}
