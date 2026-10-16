import type { Metadata } from "next";
import "./globals.css";
import { getSiteSettings } from "@/lib/site-settings";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider, AuthRecovery } from "@/features/auth/auth-provider";

export const metadata: Metadata = {
  title: { default: "KALOSARA — Portal kelurahan", template: "%s | KALOSARA" },
  description: "Kanal Layanan Online Surat dan Administrasi Rakyat",
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
