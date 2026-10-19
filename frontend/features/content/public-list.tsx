import Link from "next/link";
import { PageHeading } from "@/components/ui/page-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarDays, Images, Megaphone, Files } from "lucide-react";
import { GalleryPhotoGrid } from "./gallery-lightbox";
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
      <form className="public-content-filters rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
          Cari judul
          <input
            className="cms-input mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            name="search"
            placeholder="Ketik kata kunci pencarian…"
            maxLength={100}
            defaultValue={search}
          />
        </label>
        {kind === "events" && (
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Waktu acara
            <select
              className="cms-input mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              name="period"
              defaultValue={period}
            >
              <option value="upcoming">Mendatang / berlangsung</option>
              <option value="past">Lampau</option>
            </select>
          </label>
        )}
        {kind === "documents" && (
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Kategori
            <input
              className="cms-input mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              name="category"
              maxLength={120}
              defaultValue={category}
              placeholder="Misalnya: standar pelayanan"
            />
          </label>
        )}
        <button className="yellow-button inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover">
          Tampilkan
        </button>
      </form>
      {failed && (
        <div
          role="alert"
          className="my-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-[15px] text-red-800"
        >
          Informasi sementara tidak dapat dimuat.{" "}
          <Link className="font-semibold underline" href={channel.path}>
            Coba lagi
          </Link>
        </div>
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
            className="group min-w-0 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all duration-300 hover:border-slate-300 hover:shadow-md sm:p-7"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="break-words text-xl font-bold text-primary">
                {item.announcement?.pinned && (
                  <span aria-label="Disematkan" className="mr-1">📌 </span>
                )}
                {item.title}
              </h2>
            </div>
            {item.announcement?.expiredAt && (
              <p className="mt-2 text-xs font-medium text-amber-700">
                Berlaku sampai: {formatContentDate(item.announcement.expiredAt)}
              </p>
            )}
            {item.event && (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                <span>
                  {formatContentDate(item.event.start)} –{" "}
                  {formatContentDate(item.event.end)}
                </span>
                <span>•</span>
                <span>{item.event.location}</span>
              </div>
            )}
            <p className="my-4 whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-600">
              {item.content}
            </p>
            {item.gallery && (
              <GalleryPhotoGrid
                albumTitle={item.title}
                photos={item.gallery.photos}
              />
            )}
            {item.document && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Kategori: {item.document.category}
                </span>
                <a
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-primary-hover"
                  href={`/api/v1/public/media/${item.document.fileId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Unduh Dokumen PDF ↗
                </a>
              </div>
            )}
          </article>
        ))}
      </div>
      {data && (
        <nav
          aria-label="Halaman konten"
          className="mt-8 flex flex-wrap items-center justify-center gap-5 border-t border-slate-100 pt-6 text-sm text-muted"
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
