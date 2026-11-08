import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, Clock3, ArrowUpRight } from "lucide-react";
import { siteIdentity } from "@/lib/site-identity";
import type { SiteSettings } from "@/lib/site-settings";
export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="mt-auto bg-[#0c2038] text-slate-300">
      <div className="container grid gap-8 py-10 sm:grid-cols-2 sm:py-12 lg:grid-cols-[1.2fr_1fr_.9fr]">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src={settings.logoUrl ?? siteIdentity.logo}
              alt=""
              width={42}
              height={50}
              unoptimized
              className="h-12 w-10 object-contain"
            />
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-300">
                Kelurahan
              </p>
              <p className="mt-1 text-xl font-bold uppercase tracking-wide text-white">
                {settings.name.replace(/^Kelurahan /, "")}
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
            Informasi yang dekat, pelayanan yang lebih mudah diakses. Hadir
            untuk warga {settings.district ?? "Kecamatan Puriala"},{" "}
            {settings.regency ?? "Kabupaten Konawe"}.
          </p>
          {settings.isExample && (
            <p className="mt-3 text-xs text-amber-200/90">
              Identitas contoh — belum mewakili instansi resmi.
            </p>
          )}
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Kanal Layanan Online Surat dan Administrasi Rakyat
          </p>
        </div>
        <div>
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-200">
            Alamat & kontak
          </h2>
          <ul className="mt-4 space-y-2.5 text-[13px] leading-snug">
            <li className="flex gap-2.5">
              <MapPin size={15} className="mt-0.5 shrink-0 text-slate-500" />
              <span>{settings.address ?? "Alamat kantor belum tersedia"}</span>
            </li>
            <li className="flex gap-2.5">
              <Phone size={15} className="mt-0.5 shrink-0 text-slate-500" />
              {settings.phone ? (
                <a
                  className="hover:text-white transition-colors"
                  href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
                >
                  {settings.phone}
                </a>
              ) : (
                <span>Nomor kontak belum tersedia</span>
              )}
            </li>
            <li className="flex gap-2.5">
              <Mail size={15} className="mt-0.5 shrink-0 text-slate-500" />
              {settings.email ? (
                <a
                  className="hover:text-white transition-colors"
                  href={`mailto:${settings.email}`}
                >
                  {settings.email}
                </a>
              ) : (
                <span>Email resmi belum tersedia</span>
              )}
            </li>
            <li className="flex gap-2.5">
              <Clock3 size={15} className="mt-0.5 shrink-0 text-slate-500" />
              <span>{settings.hours ?? "Jam pelayanan belum tersedia"}</span>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-200">
            Akses informasi
          </h2>
          <ul className="mt-4 space-y-1 text-[13px]">
            {[
              { label: "Profil kelurahan", href: "/profil" },
              { label: "Panduan pelayanan", href: "/pelayanan" },
              { label: "Informasi publik", href: "/informasi-publik" },
              { label: "PPID & permohonan informasi", href: "/ppid" },
              { label: "Pengaduan masyarakat", href: "/pengaduan" },
              { label: "Kontak kelurahan", href: "/kontak" },
              { label: "Akun masyarakat", href: "/masyarakat/dashboard" },
              ...settings.relatedLinks,
            ].map((item, index) => (
              <li key={`${item.href}-${index}`}>
                <Link
                  className="group inline-flex items-center gap-1.5 py-0.5 text-slate-300 transition-colors hover:text-white"
                  href={item.href}
                >
                  <span>{item.label}</span>
                  <ArrowUpRight
                    size={11}
                    className="text-slate-500 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-amber-400"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-3.5 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} {settings.name}. KALOSARA.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 py-0.5 transition-colors hover:text-white"
          >
            Panel pengelola
            <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
