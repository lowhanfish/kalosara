import Link from "next/link";
import { ArrowUpRight, FileText, Landmark, Users } from "lucide-react";
export function ContactGuide() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <h2 className="text-lg font-bold text-primary">
        Informasi yang Anda perlukan
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Temukan jawaban awal melalui halaman berikut.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Panduan pelayanan", href: "/pelayanan", icon: Landmark },
          {
            label: "Dokumen publik",
            href: "/informasi-publik",
            icon: FileText,
          },
          { label: "Profil kelurahan", href: "/profil", icon: Users },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
          >
            <item.icon size={18} className="shrink-0 text-slate-400" />
            <span className="flex-1 text-xs font-semibold text-primary">
              {item.label}
            </span>
            <ArrowUpRight
              size={14}
              className="text-slate-400 group-hover:text-primary"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
