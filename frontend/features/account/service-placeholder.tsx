import Link from "next/link";
import { Landmark, Clock, ArrowRight } from "lucide-react";

// Presentation boundary only. Future adapters must fetch real, authorized Tahap02 data.
export type ServiceAvailability = { state: "NOT_ACTIVE" };

export function ServiceCatalogPlaceholder({
  availability,
}: {
  availability: ServiceAvailability;
}) {
  return (
    <section
      className="cms-content-row items-start rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs"
      data-state={availability.state}
    >
      <div className="flex gap-4">
        <span className="mt-1 grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-primary sm:size-12">
          <Landmark size={22} strokeWidth={1.6} />
        </span>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-bold text-primary">Katalog layanan</h2>
            <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
              Pengajuan Online Belum Aktif
            </span>
          </div>
          <p className="max-w-xl text-[15px] leading-7 text-muted">
            Pelayanan surat online sedang dipersiapkan untuk Tahap 02. Saat ini
            seluruh pengurusan administrasi dan surat keterangan dilayani secara
            langsung di kantor kelurahan.
          </p>
          <div className="pt-2">
            <Link
              href="/pelayanan"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:underline"
            >
              Lihat panduan & persyaratan berkas di kantor
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SubmissionStatusPlaceholder({
  availability,
}: {
  availability: ServiceAvailability;
}) {
  return (
    <section
      className="cms-content-row items-start rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs"
      data-state={availability.state}
    >
      <div className="flex gap-4">
        <span className="mt-1 grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 sm:size-12">
          <Clock size={22} strokeWidth={1.6} />
        </span>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-bold text-primary">Status pengajuan</h2>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              Belum Ada Riwayat
            </span>
          </div>
          <p className="max-w-xl text-[15px] leading-7 text-muted">
            Pelacakan berkas online akan otomatis terhubung ke akun ini setelah
            modul pengajuan aktif. Anda belum memiliki riwayat pengajuan surat
            digital.
          </p>
        </div>
      </div>
    </section>
  );
}

