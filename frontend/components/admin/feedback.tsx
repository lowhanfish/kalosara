import { AlertCircle, FolderOpen, LoaderCircle } from "lucide-react";
import { cmsError } from "@/features/cms/client";

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
    <div className="glass-card my-6 flex flex-col items-center border-dashed border-blue-300/80 px-6 py-14 text-center">
      <span className="mb-4 grid size-16 place-items-center rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50 to-sky-100/70 text-blue-600 shadow-sm shadow-blue-500/10">
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

export function AdminLoading({
  label = "Memuat informasi…",
}: {
  label?: string;
}) {
  return (
    <div
      role="status"
      className="glass-card my-6 flex items-center gap-3.5 p-6 text-sm font-semibold text-blue-800"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
        <LoaderCircle size={20} strokeWidth={2.2} className="animate-spin" />
      </span>
      <span>{label}</span>
    </div>
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
