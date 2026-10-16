import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider, AuthRecovery } from "@/features/auth/auth-provider";

export const metadata: Metadata = {
  title: "KALOSARA",
  description: "Kanal Layanan Online Surat dan Administrasi Rakyat",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <AuthRecovery />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
