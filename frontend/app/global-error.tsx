"use client";
import "./globals.css";
import { SystemState } from "@/components/site/system-state";
import { Button } from "@/components/ui/button";
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="id">
      <body>
        <title>Terjadi gangguan | KALOSARA</title>
        <SystemState
          code="500 • Terjadi gangguan"
          title="Portal belum dapat dimuat."
          description="Mohon coba lagi. Informasi akun dan detail teknis tidak ditampilkan di halaman ini."
        >
          <Button onClick={() => retry()}>Coba lagi</Button>
        </SystemState>
      </body>
    </html>
  );
}
