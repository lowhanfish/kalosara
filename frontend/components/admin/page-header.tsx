import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
export function AdminPageHeader({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  children?: ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-primary shadow-sm">
          <Icon size={22} strokeWidth={1.7} aria-hidden="true" />
        </span>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">
            Pengelolaan website
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>
      {children}
    </header>
  );
}
