import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
export function SectionHeading({
  title,
  eyebrow,
  href,
  icon: Icon,
}: {
  title: string;
  eyebrow: string;
  href?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-slate-500">
          <Icon size={14} aria-hidden="true" />
          {eyebrow}
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-primary sm:text-[28px]">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="flex min-h-10 shrink-0 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          Lihat semua
          <ArrowUpRight size={15} />
        </Link>
      )}
    </div>
  );
}
