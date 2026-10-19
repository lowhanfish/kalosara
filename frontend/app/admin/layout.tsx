import { AdminShell } from "@/features/cms/admin-shell";
import "@/features/cms/admin.css";
import type { Metadata } from "next";
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminShell>
      <div className="cms-shell">{children}</div>
    </AdminShell>
  );
}
