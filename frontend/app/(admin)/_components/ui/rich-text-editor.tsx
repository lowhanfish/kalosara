"use client";

import React from "react";
import { RichEditor } from "@/features/cms/rich-editor";
import type { MediaAsset } from "@/features/cms/client";

export interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  media?: MediaAsset[];
  helperText?: string;
  error?: string;
}

export function RichTextEditor({
  label,
  value,
  onChange,
  media = [],
  helperText,
  error,
}: RichTextEditorProps) {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          {label}
        </label>
      )}
      <RichEditor initial={value} onChange={onChange} images={media} />
      {error ? (
        <p className="text-[11px] font-semibold text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
