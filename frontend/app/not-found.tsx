import { SystemState } from "@/components/site/system-state";
export default function NotFound() {
  return (
    <SystemState
      code="404 • Halaman tidak ditemukan"
      title="Sepertinya Anda tersesat."
      description="Halaman yang Anda cari tidak tersedia atau alamatnya berubah. Mari kembali ke beranda untuk menemukan informasi yang Anda perlukan."
    />
  );
}
