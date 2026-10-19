import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Search } from "lucide-react";
import { searchPages } from "@/lib/public-pages";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchForm } from "@/components/site/search-form";
import {
  MotionFadeIn,
  MotionStagger,
  MotionStaggerItem,
  MotionHoverCard,
} from "@/components/ui/motion";

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
      <MotionFadeIn>
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Search className="h-4 w-4" />
          <span>Navigasi Cepat</span>
        </div>
        <h1 className="display-title mt-2 text-3xl sm:text-4xl font-bold">
          Temukan halaman Anda.
        </h1>
        <p className="mt-3 text-sm text-muted">
          Pencarian saat ini mencakup menu halaman dan layanan kelurahan.
        </p>
        <div className="my-8 max-w-xl">
          <SearchForm id="results-search" defaultValue={query} />
        </div>
        {query && (
          <p role="status" className="mb-5 text-sm font-medium text-slate-600">
            {results.length} halaman ditemukan untuk &ldquo;{query}&rdquo;
          </p>
        )}
      </MotionFadeIn>

      {results.length ? (
        <MotionStagger className="space-y-3">
          {results.map((page) => (
            <MotionStaggerItem key={page.href}>
              <MotionHoverCard>
                <Link
                  href={page.href}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div>
                    <span className="block font-bold text-slate-900 group-hover:text-primary transition-colors">
                      {page.title}
                    </span>
                    <span className="mt-1 block text-sm text-slate-500">
                      {page.description}
                    </span>
                  </div>
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <ArrowUpRight aria-hidden="true" className="size-5" />
                  </div>
                </Link>
              </MotionHoverCard>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
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
