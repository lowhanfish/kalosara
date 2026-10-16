import type { Metadata } from "next";
import { SystemState } from "@/components/site/system-state";
export const metadata: Metadata = {
  title: "Pemeliharaan",
  robots: { index: false },
};
export default function Maintenance() {
  return (
    <SystemState
      code="Pemeliharaan"
      title="Kami sedang merawat portal."
      description="Ini adalah halaman pemberitahuan pemeliharaan. Jika informasi yang Anda perlukan belum tersedia, silakan kembali ke beranda atau halaman kontak kelurahan."
    />
  );
}
