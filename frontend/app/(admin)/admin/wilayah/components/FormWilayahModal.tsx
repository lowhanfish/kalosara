"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import Editor from "@/features/admin/region/editor";
import { modules, type Kind, type Row } from "../types";

export interface FormWilayahModalProps {
  kind: Kind;
  epoch: number;
  selected: Row | null;
  notice?: string;
  onClose: () => void;
  onSaved: (row: Row) => void;
}

export function FormWilayahModal({
  kind,
  epoch,
  selected,
  notice,
  onClose,
  onSaved,
}: FormWilayahModalProps) {
  return (
    <div className="space-y-4">
      <div className="glass-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-bold text-sky-700 hover:text-sky-900 transition-colors cursor-pointer"
          onClick={onClose}
        >
          <ArrowLeft size={17} strokeWidth={2.2} />
          <span>Kembali ke Daftar {modules[kind]}</span>
        </button>
        <span className="text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200/80 px-3.5 py-1.5 rounded-xl w-fit">
          {selected
            ? `Menyunting: ${"period" in selected ? `Periode ${selected.period}` : selected.name.slice(0, 40)}`
            : `Tambah ${modules[kind]} Baru`}
        </span>
      </div>

      {notice && (
        <p
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs font-bold text-emerald-800"
        >
          {notice}
        </p>
      )}

      <Editor
        key={`${kind}-${epoch}`}
        kind={kind}
        item={selected}
        onSaved={onSaved}
      />
    </div>
  );
}
