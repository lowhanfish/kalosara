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
    <div className="cms-shell">
      <main className="container py-8" id="konten">
        <CitizenAccess>{children}</CitizenAccess>
      </main>
    </div>
  );
}
