import React from "react";

export function Skeleton({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`admin-skeleton rounded-xl ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton
          key={idx}
          className={`h-3.5 ${idx === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`glass-card p-5 space-y-3 ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="size-10 rounded-xl" />
      </div>
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div
      className="w-full overflow-hidden rounded-2xl border border-sky-200/75 bg-white/75"
      aria-hidden="true"
    >
      <div className="grid grid-cols-5 gap-4 border-b border-sky-100 bg-sky-50/70 px-4 py-3">
        {Array.from({ length: cols }).map((_, idx) => (
          <Skeleton key={idx} className="h-3.5 w-20" />
        ))}
      </div>
      <div className="divide-y divide-sky-100/70">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="grid grid-cols-5 gap-4 px-4 py-4">
            {Array.from({ length: cols }).map((__, cIdx) => (
              <Skeleton
                key={cIdx}
                className={`h-4 ${cIdx === 0 ? "w-8" : "w-full"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
