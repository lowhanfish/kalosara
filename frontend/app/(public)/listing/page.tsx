import Link from "next/link";
import { MapPin } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import { FacilityMap } from "@/features/community/facility-map";
import { getRegion, type Place } from "@/lib/region";
export const metadata = { title: "Peta dan direktori fasilitas" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const search = typeof raw.search === "string" ? raw.search.slice(0, 100) : "";
  const page = Math.min(100000, Math.max(1, Math.floor(Number(raw.page)) || 1));
  let data;
  let failed = false;
  try {
    data = await getRegion<Place>(
      "facilities",
      new URLSearchParams({ limit: "50", search, page: String(page) }),
    );
  } catch {
    failed = true;
  }
  const link = (n: number) =>
    `/listing?${new URLSearchParams({ search, page: String(n) })}`;
  return (
    <main id="konten" className="container pb-16">
      <PageHeading
        title="Peta & direktori fasilitas"
        description="Temukan fasilitas publik dan usaha di sekitar kelurahan. Pilih salah satu lokasi untuk melihat petanya."
        icon={MapPin}
      />
      <form className="public-content-filters">
        <label>
          Cari lokasi
          <input
            className="cms-input"
            name="search"
            defaultValue={search}
            maxLength={100}
            placeholder="Nama fasilitas atau usaha"
          />
        </label>
        <button className="navy-button">Cari lokasi</button>
      </form>
      {failed ? (
        <p role="alert">Peta fasilitas sementara tidak dapat dimuat.</p>
      ) : (
        data && (
          <>
            <FacilityMap items={data.items} />
            <nav
              aria-label="Halaman lokasi"
              className="mt-6 flex gap-5 text-sm"
            >
              {page > 1 && <Link href={link(page - 1)}>← Sebelumnya</Link>}
              <span>
                {data.total} lokasi · halaman {page}
              </span>
              {page * data.limit < data.total && (
                <Link href={link(page + 1)}>Berikutnya →</Link>
              )}
            </nav>
          </>
        )
      )}
    </main>
  );
}
