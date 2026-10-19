import type { Metadata } from "next";
import { CitizenAccess } from "@/features/account/access";
export const metadata: Metadata = {
  title: "Akun masyarakat",
  robots: { index: false, follow: false },
};
export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-50 py-8 sm:py-12">
      <main className="container cms-shell" id="konten">
        <CitizenAccess>{children}</CitizenAccess>
      </main>
    </div>
  );
}
