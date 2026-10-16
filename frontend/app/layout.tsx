import { siteOrigin } from "@/lib/news-seo";
import type { Metadata } from "next";
import "./globals.css";
import "@/features/cms/cms.css";
import "@/components/site/public-portal.css";
import "@/components/site/reference-design.css";
import "@/components/site/readability.css";
import { getSiteSettings } from "@/lib/site-settings";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider, AuthRecovery } from "@/features/auth/auth-provider";

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
  const settings = await getSiteSettings();
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ToastProvider>
            <SiteHeader settings={settings} />
            <AuthRecovery />
            {children}
            <SiteFooter settings={settings} />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
