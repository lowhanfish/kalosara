import { FlaskConical } from "lucide-react";
export function DemoNotice() {
  return (
    <aside
      aria-label="Mode demonstrasi"
      className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-amber-950"
    >
      <div className="mx-auto flex max-w-7xl items-start gap-2.5 text-xs leading-6 sm:items-center">
        <FlaskConical
          size={16}
          aria-hidden="true"
          className="mt-1 shrink-0 sm:mt-0"
        />
        <p>
          <strong className="font-bold">Mode demo.</strong> Konten, angka,
          jadwal, dan kontak contoh digunakan untuk pratinjau, bukan informasi
          resmi.
        </p>
      </div>
    </aside>
  );
}
