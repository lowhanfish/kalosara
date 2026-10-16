import type { Metadata } from "next";
import "@/features/cms/cms.css";
export const metadata: Metadata = {
  title: "Kelola berita dan media",
  robots: { index: false, follow: false },
};
export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
