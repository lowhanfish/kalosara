import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/ui/page-heading";
import { Newspaper } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { getNewsList, getCategories } from "@/lib/news";
import { categoryPath } from "@/lib/news-seo";
import { NewsCards } from "./cards";
export type NewsSearch = { page?: string; q?: string; contoh?: string };
export function parseNewsSearch(query: NewsSearch) {
  const page = Number(query.page ?? 1);
  if (!Number.isInteger(page) || page < 1 || page > 100000) return null;
  return { page, search: (query.q ?? "").trim().slice(0, 100) };
}
export async function NewsListPage({
  query,
  category,
}: {
  query: NewsSearch;
  category?: string;
}) {
  const filter = parseNewsSearch(query);
  if (!filter) notFound();
  const [data, categories] = await Promise.all([
    getNewsList(filter.page, filter.search, category),
    getCategories(),
  ]);
  if (!data || (filter.page > 1 && !data.items.length)) notFound();
  const base = category ? categoryPath(category) : "/berita";
  const href = (page: number) => {
    const params = new URLSearchParams({ page: String(page) });
    if (filter.search) params.set("q", filter.search);
    return `${base}?${params}`;
  };
  return (
    <main id="konten" tabIndex={-1} className="container pb-16">
      <PageHeading
        title={data.category?.name ?? "Berita kelurahan"}
        icon={Newspaper}
        description="Kabar terbaru, cerita warga, dan informasi resmi dari kelurahan."
        breadcrumbs={[
          { label: "Beranda", href: "/" },
          { label: "Berita", ...(category ? { href: "/berita" } : {}) },
          ...(data.category ? [{ label: data.category.name }] : []),
        ]}
      />
      <form action={base} className="public-content-filters">
        <label className="min-w-0 flex-1">
          Cari berita
          <input
            name="q"
            type="search"
            maxLength={100}
            defaultValue={filter.search}
            className="cms-input"
          />
        </label>
        <button className="yellow-button self-end">Cari</button>
      </form>
      <nav aria-label="Kategori berita" className="mb-7 flex flex-wrap gap-2">
        <Link
          href="/berita"
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white"
        >
          Semua berita
        </Link>
        {categories.map((item) => (
          <Link
            className="rounded-full border border-slate-200 px-4 py-2 text-xs text-primary hover:bg-slate-50"
            key={item.slug}
            href={categoryPath(item.slug)}
            aria-current={category === item.slug ? "page" : undefined}
          >
            {item.name}
          </Link>
        ))}
      </nav>
      {data.items.length ? (
        <NewsCards items={data.items} />
      ) : (
        <EmptyState
          title={
            filter.search
              ? "Berita tidak ditemukan"
              : "Belum ada berita yang dipublikasikan"
          }
          description={
            filter.search
              ? "Coba kata kunci lain atau buka semua berita."
              : "Informasi terbaru akan tampil setelah diterbitkan oleh pengelola."
          }
        />
      )}
      {data.total > data.limit && (
        <nav
          aria-label="Halaman berita"
          className="mt-9 flex items-center justify-center gap-5"
        >
          {filter.page > 1 && (
            <Link className="underline" rel="prev" href={href(filter.page - 1)}>
              Sebelumnya
            </Link>
          )}
          <span>
            Halaman {filter.page} dari {Math.ceil(data.total / data.limit)}
          </span>
          {filter.page * data.limit < data.total && (
            <Link className="underline" rel="next" href={href(filter.page + 1)}>
              Berikutnya
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
