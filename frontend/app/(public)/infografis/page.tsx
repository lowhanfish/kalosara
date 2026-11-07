import Link from "next/link";
import { ChartColumn } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
export const metadata = { title: "Infografis kelurahan" };
export default function Page() {
  return (
    <main id="konten" className="container pb-16">
      <PageHeading
        title="Infografis kelurahan"
        description="Jelajahi data kependudukan, anggaran, bantuan sosial, dan stunting yang sudah diterbitkan pengelola."
        icon={ChartColumn}
      />
      <div className="grid gap-6 md:grid-cols-2">
        {[
          ["Penduduk", "/statistik", "Jumlah penduduk dan komposisi wilayah."],
          [
            "Anggaran",
            "/anggaran",
            "Transparansi pendapatan, belanja, dan pembiayaan.",
          ],
          [
            "Bantuan sosial",
            "/bansos",
            "Rekapitulasi program dan akses pengecekan resmi.",
          ],
          [
            "Stunting",
            "/stunting",
            "Rekapitulasi penanganan stunting di kelurahan.",
          ],
        ].map(([title, href, description]) => (
          <Link
            key={href}
            href={href}
            className="rounded-2xl border border-slate-200 bg-white p-8 hover:border-primary"
          >
            <h2 className="text-xl font-bold">{title} →</h2>
            <p className="mt-3 text-sm text-muted">{description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
