"use client";

import React, { useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface AutoCompleteOption {
  value: string;
  label: string;
}

export interface AutoCompleteProps {
  label?: string;
  options: AutoCompleteOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export function AutoComplete({
  label,
  options,
  value,
  onChange,
  placeholder = "Pilih opsi...",
  error,
}: AutoCompleteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedOption = options.find((o) => o.value === value);
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="relative w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="cms-input flex w-full items-center justify-between text-left"
      >
        <span className={selectedOption ? "text-slate-900" : "text-slate-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={15} className="text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-full rounded-2xl border border-sky-200 bg-white/95 p-2 shadow-xl backdrop-blur-xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari..."
            className="cms-input mb-2 !min-h-8 !py-1.5 text-xs w-full"
          />
          <div className="max-h-48 overflow-y-auto divide-y divide-sky-50">
            {filtered.length === 0 ? (
              <p className="py-3 text-center text-xs text-slate-400">
                Tidak ditemukan
              </p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                >
                  <span>{opt.label}</span>
                  {opt.value === value && (
                    <Check size={14} className="text-sky-600" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-[11px] font-semibold text-rose-600">{error}</p>
      )}
    </div>
  );
}
