// Presentation boundary only. Future adapters must fetch real, authorized Tahap02 data.
export type ServiceAvailability = { state: "NOT_ACTIVE" };
export function ServiceCatalogPlaceholder({
  availability,
}: {
  availability: ServiceAvailability;
}) {
  return (
    <section className="cms-content-row" data-state={availability.state}>
      <div>
        <h2>Katalog layanan</h2>
        <p>
          Pelayanan surat online belum aktif. Daftar persyaratan dan pengajuan
          tersedia setelah modul pelayanan resmi diaktifkan.
        </p>
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
    <section className="cms-content-row" data-state={availability.state}>
      <div>
        <h2>Status pengajuan</h2>
        <p>
          Pelacakan pengajuan belum tersedia. Belum ada data pelayanan yang
          terhubung ke akun ini.
        </p>
      </div>
    </section>
  );
}
