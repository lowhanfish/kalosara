import { siteOrigin } from "@/lib/news-seo";
import type { Metadata } from "next";
import "./globals.css";
import "@/features/cms/cms.css";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/features/auth/auth-provider";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: "Kelurahan Watundehoa — KALOSARA",
    template: "%s | KALOSARA",
  },
  description:
    "Portal informasi Kelurahan Watundehoa, Kecamatan Puriala, Kabupaten Konawe. Profil, informasi publik, dan panduan pelayanan masyarakat.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
