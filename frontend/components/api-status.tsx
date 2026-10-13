"use client";

import { useEffect, useState } from "react";

export function ApiStatus() {
  const [status, setStatus] = useState("memeriksa koneksi");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/health", { signal: controller.signal })
      .then((response) => setStatus(response.ok ? "terhubung" : "belum terhubung"))
      .catch(() => {
        if (!controller.signal.aborted) setStatus("belum terhubung");
      });
    return () => controller.abort();
  }, []);

  return <p className="text-sm text-zinc-500">Status API: {status}. <a className="underline" href="/api/v1/health">Periksa endpoint health</a></p>;
}
