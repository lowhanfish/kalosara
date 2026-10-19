import type { Metadata } from "next";
import { SystemState } from "@/components/site/system-state";
export const metadata: Metadata = {
  title: "Gangguan layanan",
  robots: { index: false },
};
export default function ServerErrorPreview() {
  return (
    <SystemState
      code="500 • Tampilan gangguan"
      title="Layanan belum dapat diakses."
      description="Ini adalah tampilan informasi saat terjadi gangguan. Silakan kembali ke beranda dan coba lagi nanti."
    />
  );
}
