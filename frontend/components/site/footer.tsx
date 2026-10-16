import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Clock3, Mail, MapPin, Phone } from "lucide-react";
import type { SiteSettings } from "@/lib/site-settings";
export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="mt-auto bg-[#032545] text-white">
      <div className="container reference-footer-grid">
        <div className="reference-footer-brand">
          <Image
            src="/images/reference/crest.webp"
            alt=""
            width={43}
            height={51}
            unoptimized
            className="reference-footer-crest"
          />
          <p className="text-[10px] font-semibold tracking-widest text-[#ffcf24]">
            KELURAHAN
          </p>
          <p className="mt-1 text-xl font-extrabold uppercase tracking-wide">
            Watundehoa
          </p>
          <p className="mt-1 text-[10px] text-[#cbd9e5]">
            Kecamatan Puriala, Kabupaten Konawe
          </p>
          <p className="mt-2 text-sm text-[#cbd9e5]">
            Kanal Layanan Online Surat dan
            <br />
            Administrasi Rakyat
          </p>
          <p className="mt-1 max-w-xs text-sm text-[#cbd9e5]">
            Informasi yang dekat, pelayanan yang lebih mudah diakses.
          </p>
          {settings.isExample && (
            <p className="mt-4 text-xs text-[#e9d49d]">
              Identitas contoh — belum mewakili instansi resmi.
            </p>
          )}
        </div>
        <div>
          <h2 className="mb-5 text-sm font-semibold">Alamat & kontak</h2>
          <ul className="space-y-4 text-sm text-[#cbd9e5]">
            <li className="flex gap-3">
              <MapPin aria-hidden="true" className="size-4 shrink-0" />
              <span>{settings.address ?? "Alamat resmi belum diisi"}</span>
            </li>
            <li className="flex gap-3">
              <Phone aria-hidden="true" className="size-4 shrink-0" />
              {settings.phone ? (
                <a
                  className="hover:underline"
                  href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
                >
                  {settings.phone}
                </a>
              ) : (
                <span>Nomor kontak belum diisi</span>
              )}
            </li>
            <li className="flex gap-3">
              <Mail aria-hidden="true" className="size-4 shrink-0" />
              {settings.email ? (
                <a
                  className="hover:underline"
                  href={`mailto:${settings.email}`}
                >
                  {settings.email}
                </a>
              ) : (
                <span>Email resmi belum diisi</span>
              )}
            </li>
            <li className="flex gap-3">
              <Clock3 aria-hidden="true" className="size-4 shrink-0" />
              <span>{settings.hours ?? "Jam pelayanan belum diisi"}</span>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mb-5 text-sm font-semibold">Akses informasi</h2>
          <ul className="space-y-3 text-sm text-[#cbd9e5]">
            {[
              { label: "Profil kelurahan", href: "/profil" },
              { label: "Informasi publik", href: "/informasi-publik" },
              { label: "Panduan pelayanan", href: "/pelayanan" },
              { label: "Kontak kelurahan", href: "/kontak" },
              ...settings.relatedLinks,
            ].map((item, index) => (
              <li key={`${item.href}-${index}`}>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-2 hover:underline"
                >
                  {item.label}
                  <ArrowUpRight aria-hidden="true" className="size-3" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-[#cbd9e5]">
          <p>
            © {new Date().getFullYear()} {settings.name}. KALOSARA.
          </p>
          <p>Informasi publik dapat diakses tanpa akun.</p>
        </div>
      </div>
    </footer>
  );
}
