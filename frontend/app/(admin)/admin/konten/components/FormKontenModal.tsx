"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import Editor from "@/features/admin/content/editor";
import { channels, type ContentKind, type ContentItem } from "@/lib/content";

export interface FormKontenModalProps {
  kind: ContentKind;
  epoch: number;
  selected: ContentItem | null;
  onClose: () => void;
  onSaved: (item: ContentItem) => void;
}

export function FormKontenModal({
  kind,
  epoch,
  selected,
  onClose,
  onSaved,
}: FormKontenModalProps) {
  return (
    <div className="space-y-4">
      <div className="glass-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-bold text-sky-700 hover:text-sky-900 transition-colors cursor-pointer"
          onClick={onClose}
        >
          <ArrowLeft size={17} strokeWidth={2.2} />
          <span>Kembali ke Daftar {channels[kind].title}</span>
        </button>
        <span className="text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200/80 px-3.5 py-1.5 rounded-xl w-fit">
          {selected
            ? `Menyunting: ${selected.title.slice(0, 45)}`
            : `Tambah ${channels[kind].title} Baru`}
        </span>
      </div>

      <Editor
        key={`${kind}-${epoch}`}
        kind={kind}
        item={selected}
        onSaved={onSaved}
      />
    </div>
  );
}
