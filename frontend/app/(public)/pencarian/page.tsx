import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { searchPages } from "@/lib/public-pages";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchForm } from "@/components/site/search-form";
export const metadata: Metadata = {
  title: "Pencarian halaman",
  robots: { index: false },
};
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "")
    .trim()
    .slice(0, 100);
  const results = searchPages(query);
  return (
    <main id="konten" tabIndex={-1} className="container pb-16">
      <Breadcrumb
        items={[{ label: "Beranda", href: "/" }, { label: "Pencarian" }]}
      />
      <h1 className="display-title mt-5 text-4xl">Temukan halaman Anda.</h1>
      <p className="mt-4 text-muted">
        Pencarian saat ini mencakup menu halaman. Pencarian isi berita menunggu
        konten resmi tersedia.
      </p>
      <div className="my-8 max-w-xl">
        <SearchForm id="results-search" defaultValue={query} />
      </div>
      {query && (
        <p role="status" className="mb-5 text-[15px] text-muted">
          {results.length} halaman ditemukan untuk “{query}”.
        </p>
      )}
      {results.length ? (
        <ul className="space-y-3">
          {results.map((page) => (
            <li key={page.href}>
              <Link
                href={page.href}
                className="flex items-center justify-between gap-4 rounded-card border border-border bg-white p-6 hover:border-primary"
              >
                <span>
                  <span className="block font-semibold">{page.title}</span>
                  <span className="mt-1 block text-[15px] text-muted">
                    {page.description}
                  </span>
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-5 shrink-0 text-primary"
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title={
            query ? "Halaman belum ditemukan" : "Mulai dari kata yang Anda cari"
          }
          description={
            query
              ? "Coba kata lain, seperti profil, agenda, atau kontak."
              : "Masukkan nama halaman atau topik informasi pada kolom pencarian."
          }
        />
      )}
    </main>
  );
}
