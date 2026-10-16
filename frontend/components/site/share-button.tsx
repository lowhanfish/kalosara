"use client";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
export function ShareButton() {
  const toast = useToast();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          toast("Tautan halaman berhasil disalin.");
        } catch {
          toast(
            "Tautan belum dapat disalin. Salin alamat dari bilah browser Anda.",
          );
        }
      }}
    >
      <Copy aria-hidden="true" className="mr-2 size-4" />
      Salin tautan
    </Button>
  );
}
