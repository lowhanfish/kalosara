import Link from "next/link";
import Image from "next/image";
import { Breadcrumb } from "@/components/ui/breadcrumb";
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
      <Breadcrumb
        items={[{ label: "Beranda", href: "/" }, { label: channel.title }]}
      />
      <h1 className="display-title py-8 text-4xl">{channel.title}</h1>
      {kind === "documents" && (
        <p className="mb-6">
          Standar pelayanan, maklumat, kontak, dan dokumen resmi ditampilkan
          setelah disetujui serta diterbitkan pengelola.{" "}
          <Link href="/kontak" className="underline">
            Kontak kelurahan
          </Link>
        </p>
      )}
      <form className="mb-8 flex flex-wrap items-end gap-4">
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
        <p role="alert">
          Informasi sementara tidak dapat dimuat.{" "}
          <Link className="underline" href={channel.path}>
            Coba lagi
          </Link>
        </p>
      )}
      {data?.items.length === 0 && (
        <p>
          Belum ada {channel.title.toLowerCase()} yang sesuai dan telah
          diterbitkan.
        </p>
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
        <nav aria-label="Halaman konten" className="mt-8 flex flex-wrap gap-5">
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
