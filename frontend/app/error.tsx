"use client";
import { SystemState } from "@/components/site/system-state";
import { Button } from "@/components/ui/button";
export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <SystemState
      code="500 • Terjadi gangguan"
      title="Halaman belum dapat dimuat."
      description="Terjadi kendala saat membuka halaman ini. Silakan coba lagi beberapa saat kemudian."
    >
      <Button onClick={() => retry()}>Coba lagi</Button>
    </SystemState>
  );
}
