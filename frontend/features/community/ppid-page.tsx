import Link from "next/link";
import { FileText, Download } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import { getContent } from "@/lib/content";
export const ppidGroups = {
  berkala: { title: "Informasi berkala", value: "BERKALA" },
  "serta-merta": { title: "Informasi serta-merta", value: "SERTA_MERTA" },
  "setiap-saat": { title: "Informasi setiap saat", value: "SETIAP_SAAT" },
  "dasar-hukum": { title: "Dasar hukum dan kebijakan", value: "" },
} as const;
export async function PpidPage({
  group,
  searchParams,
}: {
  group?: keyof typeof ppidGroups;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const page = Math.min(100000, Math.max(1, Math.floor(Number(raw.page)) || 1));
  const search = typeof raw.search === "string" ? raw.search.slice(0, 100) : "";
  const value = group ? ppidGroups[group].value : "";
  const q = new URLSearchParams({
    limit: "12",
    page: String(page),
    search,
    ...(value ? { classification: value } : {}),
    ...(group === "dasar-hukum"
      ? {
          category:
            "Informasi tentang Peraturan, Keputusan, dan/atau Kebijakan",
        }
      : {}),
  });
  let data;
  let failed = false;
  try {
    data = await getContent("documents", q);
  } catch {
    failed = true;
  }
  const path = group ? `/ppid/${group}` : "/ppid";
  const pageLink = (n: number) =>
    `${path}?${new URLSearchParams({ search, page: String(n) })}`;
  return (
    <main id="konten" className="container pb-16">
      <PageHeading
        title={group ? ppidGroups[group].title : "PPID & keterbukaan informasi"}
        description="Akses dokumen publik kelurahan atau sampaikan permohonan informasi kepada pengelola."
        icon={FileText}
      />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(ppidGroups).map(([key, g]) => (
          <Link
            className={`rounded-xl border p-5 text-sm font-semibold ${group === key ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-primary hover:bg-slate-50"}`}
            key={key}
            href={`/ppid/${key}`}
          >
            {g.title} →
          </Link>
        ))}
      </div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-6">
        <div>
          <h2 className="font-bold">
            Belum menemukan informasi yang dibutuhkan?
          </h2>
          <p className="mt-1 text-sm text-muted">
            Permohonan masuk ke kotak masuk pengelola dan tidak dipublikasikan.
          </p>
        </div>
        <Link className="navy-button" href="/ppid/permintaan">
          Ajukan permohonan
        </Link>
      </div>
      <form className="public-content-filters">
        <label>
          Cari dokumen
          <input
            className="cms-input"
            name="search"
            maxLength={100}
            defaultValue={search}
          />
        </label>
        <button className="navy-button">Cari dokumen</button>
      </form>
      {failed ? (
        <p role="alert">
          Dokumen sementara tidak dapat dimuat. Silakan muat ulang halaman.
        </p>
      ) : data?.items.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-muted">
          Belum ada dokumen yang dipublikasikan untuk bagian ini.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data?.items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-6"
            >
              <p className="text-xs text-muted">{item.document?.category}</p>
              <h2 className="mt-3 text-lg font-bold">{item.title}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-muted">
                {item.content}
              </p>
              {item.document && (
                <a
                  className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
                  href={`/api/v1/public/media/${item.document.fileId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download size={16} />
                  Buka / unduh PDF
                </a>
              )}
            </article>
          ))}
        </div>
      )}
      {data && (
        <nav
          aria-label="Halaman dokumen PPID"
          className="mt-8 flex flex-wrap gap-5 text-sm"
        >
          {page > 1 && <Link href={pageLink(page - 1)}>← Sebelumnya</Link>}
          <span>
            Halaman {page} · {data.total} dokumen
          </span>
          {page * data.limit < data.total && (
            <Link href={pageLink(page + 1)}>Berikutnya →</Link>
          )}
        </nav>
      )}
    </main>
  );
}
