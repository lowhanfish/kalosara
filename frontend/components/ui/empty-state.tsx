import { FolderOpen } from "lucide-react";
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-10 text-center">
      <span className="mb-5 grid size-14 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-400">
        <FolderOpen size={25} strokeWidth={1.4} aria-hidden="true" />
      </span>
      <h2 className="text-base font-semibold text-primary">{title}</h2>
      <p className="mt-3 max-w-md text-xs leading-6 text-muted">
        {description}
      </p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
