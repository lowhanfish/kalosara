"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemName = "entri",
}: PaginationProps) {
  const safeTotalPages = Math.max(
    1,
    totalPages || Math.ceil(totalItems / pageSize) || 1,
  );
  if (totalItems <= 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const pages: number[] = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(safeTotalPages, currentPage + 2);
  for (let p = startPage; p <= endPage; p++) {
    pages.push(p);
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-sky-100/80">
      <p className="text-xs font-medium text-slate-500">
        Menampilkan{" "}
        <span className="font-bold text-slate-800">{startItem}</span>
        {" – "}
        <span className="font-bold text-slate-800">{endItem}</span> dari{" "}
        <span className="font-bold text-sky-700">{totalItems}</span> {itemName}
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="inline-flex h-8 items-center gap-1 rounded-xl border border-sky-200/80 bg-white/85 px-2.5 text-xs font-bold text-slate-600 hover:bg-sky-50 hover:text-sky-700 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronLeft size={14} />
          <span>Sebelumnya</span>
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`inline-flex size-8 items-center justify-center rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              p === currentPage
                ? "glass-button-primary !min-h-0 !p-0 text-white shadow-sm"
                : "border border-sky-200/70 bg-white/80 text-slate-600 hover:bg-sky-50 hover:text-sky-700"
            }`}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          disabled={currentPage >= safeTotalPages}
          onClick={() =>
            onPageChange(Math.min(safeTotalPages, currentPage + 1))
          }
          className="inline-flex h-8 items-center gap-1 rounded-xl border border-sky-200/80 bg-white/85 px-2.5 text-xs font-bold text-slate-600 hover:bg-sky-50 hover:text-sky-700 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <span>Berikutnya</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
