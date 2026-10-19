import { getSiteSettings } from "@/lib/site-settings";
import { AdminShell } from "@/features/cms/admin-shell";
import type { Metadata } from "next";
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  return <AdminShell demoContent={settings.demoContent}>{children}</AdminShell>;
}
