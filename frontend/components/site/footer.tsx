import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, Clock3, ArrowUpRight } from "lucide-react";
import { siteIdentity } from "@/lib/site-identity";
import type { SiteSettings } from "@/lib/site-settings";
export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="mt-auto bg-[#0c2038] text-slate-300">
      <div className="container grid gap-10 py-12 sm:grid-cols-2 sm:py-16 lg:grid-cols-[1.2fr_1fr_.8fr]">
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
          <p className="mt-6 max-w-xs text-[15px] leading-7 text-slate-400">
            Informasi yang dekat, pelayanan yang lebih mudah diakses. Hadir
            untuk warga {settings.district ?? "Kecamatan Puriala"},{" "}
            {settings.regency ?? "Kabupaten Konawe"}.
          </p>
          {settings.isExample && (
            <p className="mt-4 text-sm text-amber-200">
              Identitas contoh — belum mewakili instansi resmi.
            </p>
          )}
          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Kanal Layanan Online Surat dan Administrasi Rakyat
          </p>
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-white">
            Alamat & kontak
          </h2>
          <ul className="mt-6 space-y-4 text-sm leading-6">
            <li className="flex gap-3">
              <MapPin size={16} className="mt-1 shrink-0 text-slate-500" />
              <span>{settings.address ?? "Alamat kantor belum tersedia"}</span>
            </li>
            <li className="flex gap-3">
              <Phone size={16} className="mt-1 shrink-0 text-slate-500" />
              {settings.phone ? (
                <a
                  className="hover:text-white"
                  href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
                >
                  {settings.phone}
                </a>
              ) : (
                <span>Nomor kontak belum tersedia</span>
              )}
            </li>
            <li className="flex gap-3">
              <Mail size={16} className="mt-1 shrink-0 text-slate-500" />
              {settings.email ? (
                <a
                  className="hover:text-white"
                  href={`mailto:${settings.email}`}
                >
                  {settings.email}
                </a>
              ) : (
                <span>Email resmi belum tersedia</span>
              )}
            </li>
            <li className="flex gap-3">
              <Clock3 size={16} className="mt-1 shrink-0 text-slate-500" />
              <span>{settings.hours ?? "Jam pelayanan belum tersedia"}</span>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-white">
            Akses informasi
          </h2>
          <ul className="mt-5 space-y-1 text-sm">
            {[
              { label: "Profil kelurahan", href: "/profil" },
              { label: "Panduan pelayanan", href: "/pelayanan" },
              { label: "Informasi publik", href: "/informasi-publik" },
              { label: "Kontak kelurahan", href: "/kontak" },
              { label: "Akun masyarakat", href: "/masyarakat/dashboard" },
              ...settings.relatedLinks,
            ].map((item, index) => (
              <li key={`${item.href}-${index}`}>
                <Link
                  className="inline-flex min-h-9 items-center gap-2 hover:text-white"
                  href={item.href}
                >
                  {item.label}
                  <ArrowUpRight size={12} className="text-slate-500" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} {settings.name}. KALOSARA.
          </p>
          <Link
            href="/admin"
            className="inline-flex min-h-8 items-center gap-2 hover:text-white"
          >
            Panel pengelola
            <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
