import "@/components/admin/admin.css";
import type { Metadata } from "next";
import { AdminShell } from "@/features/cms/admin-shell";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: {
    default: "Ruang Kerja Admin",
    template: "%s | Admin KALOSARA",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  return <AdminShell demoContent={settings.demoContent}>{children}</AdminShell>;
}
