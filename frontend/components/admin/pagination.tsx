"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export interface AdminPaginationProps {
  page: number;
  total: number;
  limit?: number;
  onPageChange: (page: number) => void;
  itemName?: string;
  className?: string;
}

export function AdminPagination({
  page,
  total,
  limit = 10,
  onPageChange,
  itemName = "item",
  className = "",
}: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (total <= 0) return null;

  // Generate numbered pages with windowing
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (page >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  };

  const pages = getPageNumbers();

  return (
    <nav
      aria-label="Navigasi halaman"
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/80 pt-5 ${className}`}
    >
      <p className="text-xs text-slate-500 font-medium">
        Menampilkan halaman{" "}
        <span className="font-semibold text-slate-800">{page}</span> dari{" "}
        <span className="font-semibold text-slate-800">{totalPages}</span> ·
        Total <span className="font-semibold text-slate-800">{total}</span>{" "}
        {itemName}
      </p>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        {pages.map((p, idx) => {
          if (p === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 py-1 text-xs text-slate-400 select-none"
              >
                …
              </span>
            );
          }
          const isCurrent = p === page;
          return (
            <button
              key={`page-${p}`}
              type="button"
              aria-current={isCurrent ? "page" : undefined}
              onClick={() => onPageChange(Number(p))}
              className={`min-w-8 h-8 rounded-lg text-xs font-semibold transition shadow-xs ${
                isCurrent
                  ? "bg-primary text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Halaman berikutnya"
        >
          <span className="hidden sm:inline">Berikutnya</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
