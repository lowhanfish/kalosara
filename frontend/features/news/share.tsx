"use client";
import { useState } from "react";
export function ArticleShare({ url, title }: { url: string; title: string }) {
  const [notice, setNotice] = useState("");
  return (
    <div className="space-y-4">
      <p className="font-semibold">Bagikan berita</p>
      <div className="flex flex-wrap gap-5">
        <a
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
          href={`https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`}
        >
          WhatsApp
        </a>
        <a
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        >
          Facebook
        </a>
        <button
          className="underline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setNotice("Tautan berita berhasil disalin.");
            } catch {
              setNotice(`Salin alamat berikut: ${url}`);
            }
          }}
        >
          Salin tautan berita
        </button>
      </div>
      <p role="status" className="break-all text-[15px]">
        {notice}
      </p>
    </div>
  );
}
