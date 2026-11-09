import { AlertCircle, FolderOpen } from "lucide-react";
import { cmsError } from "@/features/cms/client";

export type AdminLoadingVariant =
  | "list"
  | "dashboard"
  | "cards"
  | "detail"
  | "shell";

export function AdminEmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="glass-card my-6 flex flex-col items-center border-dashed border-sky-300/80 px-6 py-14 text-center">
      <span className="mb-4 grid size-16 place-items-center rounded-2xl border border-sky-200/70 bg-gradient-to-br from-sky-50 to-sky-100/70 text-sky-600 shadow-sm shadow-sky-500/10">
        <FolderOpen size={28} strokeWidth={2} />
      </span>
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <p className="mt-1.5 max-w-md text-xs sm:text-sm leading-relaxed text-slate-500">
        {description}
      </p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-gradient-to-r from-sky-200/55 via-sky-100/85 to-sky-200/55 ${className}`}
    />
  );
}

export function AdminLoading({
  label = "Memuat informasi…",
  variant = "list",
}: {
  label?: string;
  variant?: AdminLoadingVariant;
}) {
  if (variant === "shell") {
    return (
      <div
        role="status"
        aria-label={label}
        className="w-full min-h-dvh flex bg-transparent"
      >
        <span className="sr-only">{label}</span>
        {/* Sidebar Skeleton */}
        <aside className="hidden lg:flex w-[278px] shrink-0 flex-col justify-between border-r border-sky-200/60 bg-white/75 backdrop-blur-xl p-5">
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2 py-2">
              <SkeletonBlock className="size-11 rounded-2xl shrink-0" />
              <div className="space-y-2 flex-1">
                <SkeletonBlock className="h-4 w-28 rounded-lg" />
                <SkeletonBlock className="h-3 w-36 rounded-md opacity-70" />
              </div>
            </div>
            <div className="space-y-2 pt-2">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-2xl border border-sky-100/60 bg-white/60 px-3.5 py-2.5"
                >
                  <SkeletonBlock className="size-8 rounded-xl shrink-0" />
                  <SkeletonBlock
                    className={`h-3.5 rounded-md ${idx % 2 === 0 ? "w-32" : "w-24"}`}
                  />
                </div>
              ))}
            </div>
          </div>
          <SkeletonBlock className="h-12 w-full rounded-2xl" />
        </aside>

        {/* Main Workspace Skeleton */}
        <div className="flex flex-1 flex-col min-w-0">
          <header className="flex h-[68px] items-center justify-between border-b border-sky-200/60 bg-white/75 px-6 backdrop-blur-xl">
            <div className="space-y-1.5">
              <SkeletonBlock className="h-2.5 w-44 rounded-md" />
              <SkeletonBlock className="h-4 w-32 rounded-lg" />
            </div>
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-10 w-36 rounded-2xl" />
              <SkeletonBlock className="size-10 rounded-xl" />
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1320px] flex-1 space-y-6 p-6">
            <div className="glass-card flex flex-wrap items-center justify-between gap-4 p-6">
              <div className="flex items-center gap-4">
                <SkeletonBlock className="size-13 rounded-2xl shrink-0" />
                <div className="space-y-2.5">
                  <SkeletonBlock className="h-3 w-36 rounded-full" />
                  <SkeletonBlock className="h-6 w-56 rounded-lg" />
                  <SkeletonBlock className="h-3.5 w-72 rounded-md opacity-75" />
                </div>
              </div>
              <SkeletonBlock className="h-10 w-36 rounded-xl" />
            </div>
            <ListSkeletonRows count={4} />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "dashboard") {
    return (
      <div role="status" aria-label={label} className="my-4 space-y-6">
        <span className="sr-only">{label}</span>
        <div className="admin-metrics">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="admin-metric space-y-3">
              <SkeletonBlock className="size-11 rounded-2xl" />
              <div className="space-y-1.5 pt-1">
                <SkeletonBlock className="h-3 w-28 rounded-md" />
                <SkeletonBlock className="h-2.5 w-36 rounded-md opacity-70" />
              </div>
              <SkeletonBlock className="h-8 w-20 rounded-xl" />
              <SkeletonBlock className="h-3 w-24 rounded-md opacity-80" />
            </div>
          ))}
        </div>

        <div className="admin-dashboard-panels admin-dashboard-panels-pair">
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-sky-100/80 px-6 py-5">
              <div className="flex items-center gap-3.5">
                <SkeletonBlock className="size-10 rounded-xl" />
                <div className="space-y-2">
                  <SkeletonBlock className="h-4 w-44 rounded-lg" />
                  <SkeletonBlock className="h-3 w-56 rounded-md opacity-75" />
                </div>
              </div>
              <SkeletonBlock className="h-6 w-20 rounded-full" />
            </div>
            <div className="divide-y divide-sky-100/60 px-6">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-3.5 py-3.5">
                  <SkeletonBlock className="size-9 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <SkeletonBlock className="h-3.5 w-3/5 rounded-md" />
                    <SkeletonBlock className="h-2.5 w-2/5 rounded-md opacity-70" />
                  </div>
                  <SkeletonBlock className="h-5 w-16 rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center gap-3.5 border-b border-sky-100/80 pb-4">
              <SkeletonBlock className="size-10 rounded-xl" />
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-48 rounded-lg" />
                <SkeletonBlock className="h-3 w-52 rounded-md opacity-75" />
              </div>
            </div>
            <div className="admin-shortcut-grid">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-sky-100/80 bg-white/75 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <SkeletonBlock className="size-10 rounded-xl" />
                    <SkeletonBlock className="size-4 rounded-md" />
                  </div>
                  <div className="space-y-1.5">
                    <SkeletonBlock className="h-3.5 w-28 rounded-md" />
                    <SkeletonBlock className="h-2.5 w-36 rounded-md opacity-70" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div role="status" aria-label={label} className="my-4 space-y-6">
        <span className="sr-only">{label}</span>
        {/* Overview Hero Card Skeleton */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <SkeletonBlock className="size-12 rounded-2xl shrink-0" />
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <SkeletonBlock className="h-5 w-44 rounded-lg" />
                  <SkeletonBlock className="h-5 w-24 rounded-full" />
                </div>
                <SkeletonBlock className="h-3.5 w-72 sm:w-96 rounded-md" />
                <SkeletonBlock className="h-3 w-56 rounded-md opacity-75" />
              </div>
            </div>
            <SkeletonBlock className="h-10 w-36 rounded-xl shrink-0" />
          </div>
        </div>

        {/* Grid Cards Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="glass-list-card p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <SkeletonBlock className="size-10 rounded-xl" />
                  <SkeletonBlock className="h-5 w-20 rounded-full" />
                </div>
                <SkeletonBlock className="h-4 w-3/4 rounded-lg" />
                <SkeletonBlock className="h-3 w-full rounded-md opacity-80" />
                <SkeletonBlock className="h-3 w-2/3 rounded-md opacity-65" />
              </div>
              <div className="flex items-center justify-between border-t border-sky-100/70 pt-3">
                <SkeletonBlock className="h-3 w-20 rounded-md" />
                <SkeletonBlock className="h-8 w-24 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div role="status" aria-label={label} className="my-4 space-y-5">
        <span className="sr-only">{label}</span>
        <div className="glass-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-100/80 pb-5">
            <div className="flex items-start gap-4">
              <SkeletonBlock className="size-12 rounded-2xl shrink-0" />
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <SkeletonBlock className="h-5 w-24 rounded-full" />
                  <SkeletonBlock className="h-5 w-28 rounded-full" />
                </div>
                <SkeletonBlock className="h-5 w-64 sm:w-80 rounded-lg" />
                <SkeletonBlock className="h-3.5 w-48 rounded-md opacity-75" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-10 w-28 rounded-xl" />
              <SkeletonBlock className="h-10 w-32 rounded-xl" />
            </div>
          </div>

          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-48 rounded-md" />
            <SkeletonBlock className="h-3.5 w-full rounded-md opacity-85" />
            <SkeletonBlock className="h-3.5 w-11/12 rounded-md opacity-80" />
            <SkeletonBlock className="h-3.5 w-4/5 rounded-md opacity-75" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <SkeletonBlock className="h-24 w-full rounded-2xl" />
            <SkeletonBlock className="h-24 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div role="status" aria-label={label} className="my-4 space-y-3.5">
      <span className="sr-only">{label}</span>
      <ListSkeletonRows count={5} />
    </div>
  );
}

function ListSkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <>
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="glass-list-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5"
          >
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              <SkeletonBlock className="size-12 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <SkeletonBlock className="h-4 w-20 rounded-full" />
                  <SkeletonBlock className="h-4 w-24 rounded-full opacity-80" />
                  <SkeletonBlock className="h-3 w-28 rounded-md opacity-65" />
                </div>
                <SkeletonBlock
                  className={`h-4 rounded-lg ${
                    idx % 2 === 0 ? "w-3/4 sm:w-2/3" : "w-4/5 sm:w-1/2"
                  }`}
                />
                <SkeletonBlock className="h-3 w-2/5 rounded-md opacity-70" />
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <SkeletonBlock className="h-9 w-24 rounded-xl" />
              <SkeletonBlock className="h-9 w-20 rounded-xl opacity-80" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Bar Skeleton */}
      <div className="glass-toolbar flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <SkeletonBlock className="h-4 w-44 rounded-md" />
        <div className="flex items-center gap-1.5">
          <SkeletonBlock className="h-8 w-20 rounded-xl" />
          <SkeletonBlock className="size-8 rounded-xl" />
          <SkeletonBlock className="size-8 rounded-xl opacity-75" />
          <SkeletonBlock className="h-8 w-20 rounded-xl" />
        </div>
      </div>
    </>
  );
}

export function AdminError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="my-5 flex items-start gap-3.5 rounded-2xl border border-red-200/90 bg-red-50/90 backdrop-blur-md p-4 text-sm text-red-900 shadow-sm"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600">
        <AlertCircle size={20} strokeWidth={2} />
      </span>
      <div className="pt-0.5">
        <p className="font-medium">{cmsError(error)}</p>
        {onRetry && (
          <button
            className="mt-2 inline-flex items-center rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700 transition-colors"
            onClick={onRetry}
          >
            Coba lagi
          </button>
        )}
      </div>
    </div>
  );
}
