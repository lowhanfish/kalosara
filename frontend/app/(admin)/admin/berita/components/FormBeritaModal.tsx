"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { NewsEditor } from "@/features/cms/news-editor";
import type { News } from "@/features/cms/client";

export interface FormBeritaModalProps {
  selected: News;
  editorEpoch: number;
  notice?: string;
  onClose: () => void;
  onSaved: (news: News, cacheInvalidated?: boolean) => void;
}

export function FormBeritaModal({
  selected,
  editorEpoch,
  notice,
  onClose,
  onSaved,
}: FormBeritaModalProps) {
  return (
    <div className="space-y-4">
      <div className="glass-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 text-sm font-bold text-sky-700 hover:text-sky-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={17} strokeWidth={2.2} />
          <span>Kembali ke Daftar Berita</span>
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200/80 px-3.5 py-1.5 rounded-xl w-fit">
          {selected.title
            ? `Menyunting: ${selected.title.slice(0, 48)}`
            : "Menulis Berita Baru"}
        </span>
      </div>

      {notice && (
        <p
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50/90 backdrop-blur-md p-4 text-xs font-bold text-emerald-800 shadow-xs"
        >
          {notice}
        </p>
      )}

      <NewsEditor
        key={`${selected.id}-${selected.version}-${editorEpoch}`}
        initial={selected}
        onSaved={onSaved}
      />
    </div>
  );
}
