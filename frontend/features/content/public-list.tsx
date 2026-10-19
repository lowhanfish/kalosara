import Link from "next/link";
import Image from "next/image";
import { PageHeading } from "@/components/ui/page-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarDays, Images, Megaphone, Files } from "lucide-react";
import {
  channels,
  getContent,
  formatContentDate,
  type ContentKind,
} from "@/lib/content";
export async function ContentPage({
  kind,
  searchParams,
}: {
  kind: ContentKind;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const page = Math.min(
    100000,
    Math.max(
      1,
      Number.isFinite(Number(raw.page)) ? Math.floor(Number(raw.page)) : 1,
    ),
  );
  const search = typeof raw.search === "string" ? raw.search.slice(0, 100) : "";
  const period = raw.period === "past" ? "past" : "upcoming";
  const category =
    typeof raw.category === "string" ? raw.category.slice(0, 120) : "";
  const params = new URLSearchParams({
    page: String(Math.floor(page)),
    limit: kind === "galleries" ? "4" : "10",
    search,
    ...(kind === "events" ? { period } : {}),
    ...(category ? { category } : {}),
  });
  let data;
  let failed = false;
  try {
    data = await getContent(kind, params);
  } catch {
    failed = true;
  }
  const channel = channels[kind];
  const pageLink = (n: number) => {
    const p = new URLSearchParams(params);
    p.set("page", String(n));
    return `${channel.path}?${p}`;
  };
  return (
    <main id="konten" tabIndex={-1} className="container pb-16">
      <PageHeading
        title={channel.title}
        icon={
          {
            events: CalendarDays,
            galleries: Images,
            announcements: Megaphone,
            documents: Files,
          }[kind]
        }
        description={
          {
            events: "Jadwal kegiatan dan ruang kebersamaan warga kelurahan.",
            galleries: "Cerita dan dokumentasi kegiatan warga dalam gambar.",
            announcements:
              "Informasi penting dan pemberitahuan terbaru dari kelurahan.",
            documents:
              "Temukan dokumen dan informasi resmi yang telah diterbitkan kelurahan.",
          }[kind]
        }
      />
      <form className="public-content-filters">
        <label>
          Cari judul
          <input
            className="cms-input"
            name="search"
            maxLength={100}
            defaultValue={search}
          />
        </label>
        {kind === "events" && (
          <label>
            Waktu acara
            <select className="cms-input" name="period" defaultValue={period}>
              <option value="upcoming">Mendatang / berlangsung</option>
              <option value="past">Lampau</option>
            </select>
          </label>
        )}
        {kind === "documents" && (
          <label>
            Kategori
            <input
              className="cms-input"
              name="category"
              maxLength={120}
              defaultValue={category}
              placeholder="Misalnya standar pelayanan"
            />
          </label>
        )}
        <button className="yellow-button">Tampilkan</button>
      </form>
      {failed && (
        <p
          role="alert"
          className="my-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
        >
          Informasi sementara tidak dapat dimuat.{" "}
          <Link className="underline" href={channel.path}>
            Coba lagi
          </Link>
        </p>
      )}
      {data?.items.length === 0 && (
        <EmptyState
          title={
            search
              ? "Hasil belum ditemukan"
              : `Belum ada ${channel.title.toLowerCase()}`
          }
          description={
            search
              ? "Coba kata kunci lain atau hapus filter pencarian."
              : "Informasi akan tersedia setelah diterbitkan oleh pengelola kelurahan."
          }
        />
      )}
      <div className="space-y-6">
        {data?.items.map((item) => (
          <article
            id={item.id}
            key={item.id}
            className="min-w-0 rounded-xl border border-border p-5"
          >
            <h2 className="break-words text-xl font-bold">
              {item.announcement?.pinned && (
                <span aria-label="Disematkan">📌 </span>
              )}
              {item.title}
            </h2>
            {item.announcement?.expiredAt && (
              <p className="mt-2 text-sm">
                Berlaku sampai {formatContentDate(item.announcement.expiredAt)}
              </p>
            )}
            {item.event && (
              <p className="mt-2 text-sm">
                {formatContentDate(item.event.start)} –{" "}
                {formatContentDate(item.event.end)}
                <br />
                {item.event.location}
              </p>
            )}
            <p className="my-4 whitespace-pre-wrap break-words">
              {item.content}
            </p>
            {item.gallery && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {item.gallery.photos.map((photo) => (
                  <figure key={photo.mediaId}>
                    <a
                      href={`/api/v1/public/media/${photo.mediaId}?variant=display`}
                    >
                      <Image
                        src={`/api/v1/public/media/${photo.mediaId}?variant=thumb`}
                        alt={photo.alt}
                        width={480}
                        height={320}
                        loading="lazy"
                        unoptimized
                        className="aspect-[3/2] w-full rounded object-cover"
                      />
                    </a>
                    <figcaption className="mt-2 break-words text-sm">
                      {photo.alt}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
            {item.document && (
              <p>
                {item.document.category} ·{" "}
                <a
                  className="underline"
                  href={`/api/v1/public/media/${item.document.fileId}`}
                >
                  Unduh PDF — {item.title}
                </a>
              </p>
            )}
          </article>
        ))}
      </div>
      {data && (
        <nav
          aria-label="Halaman konten"
          className="mt-8 flex flex-wrap items-center justify-center gap-5 border-t border-slate-100 pt-6 text-xs text-muted"
        >
          {page > 1 && <Link href={pageLink(page - 1)}>Sebelumnya</Link>}
          <span>
            Halaman {page} · {data.total} item
          </span>
          {page * data.limit < data.total && (
            <Link href={pageLink(page + 1)}>Berikutnya</Link>
          )}
        </nav>
      )}
    </main>
  );
}
