"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, FileText, X } from "lucide-react";

export interface FileInputProps {
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  helperText?: string;
  error?: string;
  value?: File | null;
  previewUrl?: string | null;
  onChange?: (file: File | null) => void;
}

export function FileInput({
  label,
  accept = "image/*,application/pdf",
  maxSizeMB = 10,
  helperText,
  error,
  value,
  previewUrl,
  onChange,
}: FileInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [localError, setLocalError] = useState<string>("");

  const handleFile = (file: File | null) => {
    setLocalError("");
    if (file && file.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`Ukuran berkas maksimal ${maxSizeMB} MB.`);
      return;
    }
    onChange?.(file);
  };

  const displayError = error || localError;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          {label}
        </label>
      )}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const dropped = e.dataTransfer.files?.[0] ?? null;
          handleFile(dropped);
        }}
        className="group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sky-300/80 bg-sky-50/40 p-5 text-center transition-colors hover:border-sky-400 hover:bg-sky-50/80"
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        {previewUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Pratinjau"
              className="max-h-36 rounded-xl object-contain border border-sky-200"
            />
          </div>
        ) : (
          <div className="glass-icon-box size-11 rounded-2xl text-sky-600">
            {value ? <FileText size={20} /> : <UploadCloud size={20} />}
          </div>
        )}
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-slate-800">
            {value ? value.name : "Klik atau seret berkas ke area ini"}
          </p>
          <p className="text-[11px] text-slate-500">
            {helperText ?? `Maksimal ${maxSizeMB} MB`}
          </p>
        </div>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleFile(null);
            }}
            className="mt-1 inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100"
          >
            <X size={12} /> Hapus Pilihan
          </button>
        )}
      </div>
      {displayError && (
        <p className="text-[11px] font-semibold text-rose-600">
          {displayError}
        </p>
      )}
    </div>
  );
}
