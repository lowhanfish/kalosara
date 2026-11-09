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
      className={`glass-card flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3.5 ${className}`}
    >
      <p className="text-xs text-slate-600 font-medium">
        Menampilkan halaman{" "}
        <span className="font-bold text-sky-900">{page}</span> dari{" "}
        <span className="font-bold text-sky-900">{totalPages}</span> · Total{" "}
        <span className="inline-flex items-center rounded-md bg-sky-50 border border-sky-200/70 px-1.5 py-0.5 font-bold text-sky-700">
          {total}
        </span>{" "}
        {itemName}
      </p>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="glass-button-secondary h-9 min-h-9 px-3 py-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft size={16} strokeWidth={2.2} />
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        {pages.map((p, idx) => {
          if (p === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 py-1 text-xs font-bold text-slate-400 select-none"
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
              className={`min-w-9 h-9 min-h-9 rounded-xl text-xs font-bold transition ${
                isCurrent
                  ? "glass-button-primary px-2.5 py-1"
                  : "glass-button-secondary px-2.5 py-1 text-slate-700"
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
          className="glass-button-secondary h-9 min-h-9 px-3 py-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Halaman berikutnya"
        >
          <span className="hidden sm:inline">Berikutnya</span>
          <ChevronRight size={16} strokeWidth={2.2} />
        </button>
      </div>
    </nav>
  );
}
