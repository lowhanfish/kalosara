import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Breadcrumb } from "./breadcrumb";
export function PageHeading({
  title,
  description,
  eyebrow = "Informasi kelurahan",
  icon: Icon,
  children,
  breadcrumbs,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  children?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  return (
    <>
      <Breadcrumb
        items={
          breadcrumbs ?? [{ label: "Beranda", href: "/" }, { label: title }]
        }
      />
      <header className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-8 pt-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between sm:pb-10">
        <div className="max-w-3xl">
          <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-slate-500">
            {Icon && <Icon size={16} aria-hidden="true" />}
            {eyebrow}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl lg:text-[42px]">
            {title}
          </h1>
          {description && (
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
              {description}
            </p>
          )}
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </header>
    </>
  );
}
