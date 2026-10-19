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
    <div className="my-6 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-slate-50 text-slate-400">
        <FolderOpen size={26} strokeWidth={1.5} />
      </span>
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      <p className="mt-2 max-w-md text-[15px] leading-6 text-slate-500">
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
      className="my-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 text-[15px] text-slate-500"
    >
      <LoaderCircle size={18} className="animate-spin" />
      {label}
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
      className="my-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-[15px] text-red-800"
    >
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <div>
        <p>{cmsError(error)}</p>
        {onRetry && (
          <button
            className="mt-2 font-semibold underline underline-offset-4"
            onClick={onRetry}
          >
            Coba lagi
          </button>
        )}
      </div>
    </div>
  );
}
