import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin, Phone } from "lucide-react";
import { publicPages, type PublicPath } from "@/lib/public-pages";
import { getSiteSettings } from "@/lib/site-settings";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table } from "@/components/ui/table";
import { ContactGuide } from "./contact-guide";
import { ShareButton } from "./share-button";
import { Dialog } from "@/components/ui/dialog";

const emptyTitles: Partial<Record<PublicPath, string>> = {
  "/profil": "Profil resmi sedang disiapkan",
  "/berita": "Belum ada berita yang diterbitkan",
  "/pengumuman": "Belum ada pengumuman",
  "/agenda": "Belum ada agenda yang dijadwalkan",
  "/galeri": "Belum ada dokumentasi yang diterbitkan",
  "/informasi-publik": "Belum ada dokumen publik",
  "/statistik": "Data statistik belum dipublikasikan",
};
export async function PublicSection({ href }: { href: PublicPath }) {
  const page = publicPages.find((item) => item.href === href)!;
  const settings = await getSiteSettings();
  return (
    <main id="konten" tabIndex={-1} className="container pb-16">
      <Breadcrumb
        items={[{ label: "Beranda", href: "/" }, { label: page.title }]}
      />
      <div className="mb-9 flex flex-wrap items-end justify-between gap-5 border-b border-border pb-8">
        <div>
          <Badge>Pratinjau • konten resmi belum tersedia</Badge>
          <h1 className="display-title mt-5 text-4xl sm:text-5xl">
            {page.title === "Profil" ? "Profil kelurahan" : page.title}
          </h1>
          <p className="mt-4 max-w-2xl text-muted">{page.description}</p>
        </div>
        <ShareButton />
      </div>
      {href === "/kontak" ? (
        <div className="grid items-start gap-7 lg:grid-cols-2">
          <Card>
            <p className="eyebrow">Kantor kelurahan</p>
            <h2 className="mt-3 text-2xl font-semibold">{settings.name}</h2>
            <dl className="mt-7 space-y-6 text-sm">
              {[
                { title: "Alamat", value: settings.address, icon: MapPin },
                { title: "Nomor kontak", value: settings.phone, icon: Phone },
                { title: "Jam pelayanan", value: settings.hours, icon: Clock3 },
              ].map(({ title, value, icon: Icon }) => (
                <div key={title} className="flex gap-4">
                  <Icon
                    aria-hidden="true"
                    className="size-5 shrink-0 text-primary"
                  />
                  <div>
                    <dt className="font-semibold">{title}</dt>
                    <dd className="mt-1 text-muted">
                      {value ?? `${title} resmi belum diisi.`}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
            <p className="mt-7 border-t border-border pt-5 text-xs text-muted">
              Peta akan ditampilkan setelah lokasi resmi ditetapkan.
            </p>
          </Card>
          <ContactGuide />
        </div>
      ) : href === "/pelayanan" ? (
        <div className="space-y-7">
          <Card className="border-[#b3c8ad] bg-soft">
            <p className="eyebrow">Informasi pelayanan</p>
            <h2 className="display-title mt-3 text-3xl">
              Kenali alurnya sebelum berkunjung.
            </h2>
            <p className="mt-4 max-w-3xl text-sm text-muted">
              Halaman ini disiapkan untuk panduan persyaratan dan prosedur
              resmi. Pengajuan surat online belum tersedia. Konfirmasikan
              kebutuhan Anda kepada kantor kelurahan.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/kontak">
                  Kontak kelurahan{" "}
                  <ArrowUpRight aria-hidden="true" className="ml-3 size-4" />
                </Link>
              </Button>
              <Dialog
                title="Tentang pelayanan online"
                triggerLabel="Tentang tahap pelayanan"
              >
                <p className="text-sm text-muted">
                  KALOSARA Tahap 01 menyediakan website dan informasi publik.
                  Pengajuan, unggah berkas, dan pelacakan surat dikerjakan pada
                  Tahap 02. Belum ada permohonan yang dapat dikirim dari halaman
                  ini.
                </p>
              </Dialog>
            </div>
          </Card>
          <Table label="Ketersediaan informasi pelayanan">
            <caption className="p-4 text-left text-sm font-semibold">
              Status informasi pelayanan
            </caption>
            <thead>
              <tr>
                <th scope="col">Informasi</th>
                <th scope="col">Ketersediaan</th>
                <th scope="col">Langkah berikutnya</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Persyaratan & prosedur resmi</td>
                <td>Belum dipublikasikan</td>
                <td>Hubungi kantor kelurahan</td>
              </tr>
              <tr>
                <td>Pengajuan surat online</td>
                <td>Belum tersedia</td>
                <td>Menunggu pengembangan Tahap 02</td>
              </tr>
            </tbody>
          </Table>
        </div>
      ) : (
        <>
          <EmptyState
            title={emptyTitles[href] ?? "Konten sedang disiapkan"}
            description={
              href === "/statistik"
                ? "Angka agregat akan ditampilkan bersama sumber data dan periode pembaruannya. Belum ada angka yang dapat dijadikan rujukan."
                : "Ini adalah halaman kerangka pengembangan. Informasi akan ditampilkan setelah diverifikasi dan diterbitkan oleh kelurahan."
            }
          >
            <Button asChild variant="outline">
              <Link href="/kontak">Hubungi kelurahan</Link>
            </Button>
          </EmptyState>
          {href === "/profil" && (
            <section
              className="mt-8 grid gap-5 sm:grid-cols-3"
              aria-label="Struktur profil yang akan dilengkapi"
            >
              {["Sejarah & wilayah", "Visi & misi", "Aparatur kelurahan"].map(
                (title) => (
                  <Card key={title}>
                    <h2 className="text-sm font-semibold">{title}</h2>
                    <p className="mt-2 text-xs text-muted">
                      Placeholder • belum ada data resmi
                    </p>
                    <div aria-hidden="true" className="mt-5 space-y-2">
                      <Skeleton className="h-2 w-full animate-none" />
                      <Skeleton className="h-2 w-3/4 animate-none" />
                    </div>
                  </Card>
                ),
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}
