import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  FileText,
  Images,
  Landmark,
  MapPin,
  Megaphone,
  MessageCircle,
  Newspaper,
  Phone,
  Users,
  ChartNoAxesCombined,
  Clock3,
  LayoutGrid,
} from "lucide-react";
import { siteIdentity } from "@/lib/site-identity";

const shortcuts = [
  {
    title: "Informasi pelayanan",
    href: "/pelayanan",
    icon: Landmark,
    tone: "gold",
  },
  { title: "Profil kelurahan", href: "/profil", icon: FileText, tone: "blue" },
  {
    title: "Informasi publik",
    href: "/informasi-publik",
    icon: BookOpen,
    tone: "blue",
  },
  {
    title: "Agenda kegiatan",
    href: "/agenda",
    icon: CalendarDays,
    tone: "green",
  },
  {
    title: "Kontak kelurahan",
    href: "/kontak",
    icon: Megaphone,
    tone: "orange",
  },
  { title: "Galeri kantor", href: "/galeri", icon: Images, tone: "gold" },
  {
    title: "Statistik kelurahan",
    href: "/statistik",
    icon: ChartNoAxesCombined,
    tone: "blue",
  },
];
function SectionHeading({
  icon: Icon,
  eyebrow,
  title,
  href,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  href: string;
}) {
  return (
    <div className="portal-section-heading">
      <span className="section-icon">
        <Icon aria-hidden="true" size={20} />
      </span>
      <div>
        <p className="mini-label">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <Link href={href}>
        Lihat semua <ArrowRight aria-hidden="true" size={14} />
      </Link>
    </div>
  );
}
const guidance = [
  { title: "Persyaratan pelayanan", href: "/pelayanan", icon: FileText },
  { title: "Panduan pelayanan", href: "/pelayanan", icon: BookOpen },
  { title: "Informasi kelurahan", href: "/profil", icon: Users },
  { title: "Kontak petugas", href: "/kontak", icon: Phone },
  { title: "Informasi publik", href: "/informasi-publik", icon: Newspaper },
  { title: "Semua informasi", href: "/pelayanan", icon: LayoutGrid },
];
export default function Home() {
  return (
    <main id="konten" tabIndex={-1} className="portal-home">
      <section className="modern-hero" aria-labelledby="hero-title">
        <Image
          src={siteIdentity.officePhoto}
          alt="Kantor Kelurahan Watundehoa dengan bangunan biru dan atap merah"
          fill
          unoptimized
          preload
          sizes="100vw"
          className="modern-hero-bg"
        />
        <div className="modern-hero-shade" aria-hidden="true" />
        <div className="container modern-hero-inner">
          <div className="modern-hero-copy">
            <p className="mini-label text-[#ffcf24]">Kelurahan Watundehoa</p>
            <h1 id="hero-title">
              Lebih dekat.
              <br />
              Lebih mudah.
              <br />
              <span>Untuk warga.</span>
            </h1>
            <p className="hero-intro">
              Portal informasi Kelurahan Watundehoa
              <br />
              Kecamatan Puriala, Kabupaten Konawe.
              <br />
              Informasi kelurahan dan panduan pelayanan, lebih mudah diakses
              oleh seluruh masyarakat.
            </p>
            <div className="hero-actions">
              <Link className="yellow-button" href="/profil">
                Informasi kelurahan <ArrowRight aria-hidden="true" size={16} />
              </Link>
              <Link className="white-button" href="/pelayanan">
                Panduan pelayanan <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
          </div>
          <div className="hero-leader-photo">
            <Image
              src={siteIdentity.leaderPhoto}
              alt="AMIRULAH, S.Si, Lurah Watundehoa"
              fill
              unoptimized
              loading="eager"
              sizes="(max-width: 768px) 55vw, 360px"
              className="object-cover object-top"
            />
          </div>
          <div className="hero-leader-card">
            <p className="font-extrabold">{siteIdentity.leader}</p>
            <p className="mt-0.5 text-xs">Lurah Watundehoa</p>
            <div className="mt-3 flex items-start gap-3 border-t border-border pt-3">
              <Users
                className="shrink-0 text-[#b18000]"
                aria-hidden="true"
                size={23}
              />
              <p className="text-xs leading-5 text-muted">
                Kenali kelurahan dan aparatur yang melayani masyarakat
                Watundehoa.
              </p>
            </div>
          </div>
        </div>
        <div className="hero-yellow-ribbon" aria-hidden="true" />
      </section>
      <section className="container quick-access" aria-label="Akses cepat">
        <div className="quick-access-panel">
          {shortcuts.map(({ title, href, icon: Icon, tone }, index) => (
            <Link
              key={title}
              href={href}
              className={`quick-tile ${index === 0 ? "quick-tile-featured" : ""}`}
            >
              <span className={`tile-icon tone-${tone}`}>
                <Icon aria-hidden="true" size={23} strokeWidth={1.8} />
              </span>
              <span className="quick-tile-title">{title}</span>
              <span className="round-arrow">
                <ArrowRight aria-hidden="true" size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="container portal-news-grid section-space">
        <div>
          <SectionHeading
            icon={Newspaper}
            eyebrow="Kabar kelurahan"
            title="Berita terbaru"
            href="/berita"
          />
          <div className="news-content">
            <Link href="/profil" className="office-feature">
              <Image
                src={siteIdentity.officeSignPhoto}
                alt="Papan nama Kantor Kelurahan Watundehoa"
                fill
                unoptimized
                sizes="(max-width:768px) 100vw, 33vw"
                className="object-cover"
              />
              <div className="office-feature-caption">
                <span>PROFIL KELURAHAN</span>
                <h3>
                  Mengenal lebih dekat
                  <br />
                  Kelurahan Watundehoa
                </h3>
                <p>Kecamatan Puriala, Kabupaten Konawe.</p>
              </div>
              <span className="round-arrow">
                <ArrowRight aria-hidden="true" size={16} />
              </span>
            </Link>
            <div className="news-empty">
              <span className="tile-icon tone-blue">
                <Newspaper aria-hidden="true" size={24} />
              </span>
              <h3>Kabar resmi akan hadir di sini.</h3>
              <p>
                Belum ada berita yang diterbitkan. Nantikan informasi dan
                kegiatan dari Kelurahan Watundehoa.
              </p>
              <Link href="/berita">
                Buka halaman berita <ArrowRight aria-hidden="true" size={14} />
              </Link>
            </div>
          </div>
        </div>
        <aside>
          <SectionHeading
            icon={Megaphone}
            eyebrow="Papan informasi"
            title="Pengumuman"
            href="/pengumuman"
          />
          <div className="announcement-panel">
            <div className="announcement-empty">
              <span className="tile-icon tone-orange">
                <Megaphone aria-hidden="true" size={22} />
              </span>
              <div>
                <h3>Belum ada pengumuman terbaru</h3>
                <p>Pengumuman resmi akan ditampilkan setelah diterbitkan.</p>
              </div>
            </div>
            <Link className="announcement-link" href="/pelayanan">
              <span className="tile-icon tone-green">
                <BookOpen aria-hidden="true" size={21} />
              </span>
              <span>
                Perlu informasi pelayanan?
                <small>Kenali alur sebelum berkunjung.</small>
              </span>
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
            <Link className="announcement-link" href="/kontak">
              <span className="tile-icon tone-blue">
                <MessageCircle aria-hidden="true" size={21} />
              </span>
              <span>
                Hubungi kelurahan<small>Temukan informasi kontak kantor.</small>
              </span>
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </aside>
      </section>
      <section className="service-band">
        <Image
          src={siteIdentity.officePhoto}
          alt=""
          fill
          unoptimized
          sizes="100vw"
          className="object-cover"
        />
        <div className="service-band-shade" aria-hidden="true" />
        <div className="container relative">
          <div className="service-band-heading">
            <div>
              <p className="mini-label">Informasi pelayanan</p>
              <h2>Urusan administrasi, mulai dari informasi.</h2>
              <p>
                Kenali panduan pelayanan sebelum datang ke kantor.
                <br />
                Pengajuan surat online belum tersedia.
              </p>
            </div>
            <Link href="/pelayanan" className="yellow-button">
              Lihat panduan pelayanan{" "}
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
          <div className="service-tiles">
            {guidance.map(({ title, href, icon: Icon }, index) => (
              <Link href={href} key={title}>
                <span
                  className={`tile-icon tone-${index < 2 ? "green" : index < 5 ? "gold" : "blue"}`}
                >
                  <Icon aria-hidden="true" size={24} />
                </span>
                <ArrowRight
                  aria-hidden="true"
                  size={13}
                  className="service-tile-arrow"
                />
                <span>{title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="container profile-overview section-space">
        <div>
          <div className="portal-section-heading">
            <span className="section-icon">
              <Landmark aria-hidden="true" size={20} />
            </span>
            <div>
              <p className="mini-label">Profil kelurahan</p>
              <h2>Tentang Kelurahan Watundehoa</h2>
            </div>
          </div>
          <p className="profile-description">
            Kelurahan Watundehoa berada di Kecamatan Puriala, Kabupaten Konawe.
            Melalui KALOSARA, informasi kelurahan dan panduan pelayanan dapat
            diakses masyarakat dalam satu tempat.
          </p>
          <Link className="soft-button" href="/profil">
            Kenali kelurahan kami <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </div>
        <dl className="identity-facts">
          {[
            { label: "Kecamatan", value: "Puriala", icon: MapPin },
            { label: "Kabupaten", value: "Konawe", icon: Landmark },
            { label: "Lurah", value: "AMIRULAH, S.Si", icon: Users },
            { label: "Kanal informasi", value: "KALOSARA", icon: LayoutGrid },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label}>
              <span className="tile-icon tone-blue">
                <Icon aria-hidden="true" size={21} />
              </span>
              <span>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </span>
            </div>
          ))}
        </dl>
        <Link href="/profil" className="profile-photo">
          <Image
            src={siteIdentity.officeSignPhoto}
            alt="Identitas Kantor Kelurahan Watundehoa"
            fill
            unoptimized
            sizes="(max-width:768px) 100vw, 25vw"
            className="object-cover"
          />
          <span>
            Kenali wilayah.
            <br />
            Terhubung dengan
            <br />
            kelurahan Anda.
          </span>
        </Link>
      </section>
      <section className="container agenda-gallery section-space">
        <div>
          <SectionHeading
            icon={CalendarDays}
            eyebrow="Agenda kegiatan"
            title="Agenda kelurahan"
            href="/agenda"
          />
          <div className="agenda-placeholder">
            <span className="calendar-placeholder">
              <CalendarDays aria-hidden="true" size={30} />
            </span>
            <div>
              <h3>Jadwal kegiatan sedang disiapkan.</h3>
              <p>
                Belum ada agenda yang diterbitkan. Kegiatan resmi kelurahan akan
                ditampilkan di sini.
              </p>
              <Link href="/agenda">
                Lihat halaman agenda <ArrowRight aria-hidden="true" size={14} />
              </Link>
            </div>
          </div>
          <Link href="/kontak" className="agenda-help">
            <Clock3 aria-hidden="true" size={20} />
            <span>
              Konfirmasikan informasi kegiatan melalui kontak kelurahan.
            </span>
            <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </div>
        <div>
          <SectionHeading
            icon={Images}
            eyebrow="Dokumentasi kantor"
            title="Galeri kelurahan"
            href="/galeri"
          />
          <div className="office-gallery">
            <figure>
              <div>
                <Image
                  src={siteIdentity.officePhoto}
                  alt="Gedung Kantor Kelurahan Watundehoa"
                  fill
                  unoptimized
                  sizes="(max-width:768px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              <figcaption>Kantor Kelurahan Watundehoa</figcaption>
            </figure>
            <figure>
              <div>
                <Image
                  src={siteIdentity.officeSignPhoto}
                  alt="Papan nama kelurahan di halaman kantor"
                  fill
                  unoptimized
                  sizes="(max-width:768px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              <figcaption>Halaman dan papan nama kantor</figcaption>
            </figure>
          </div>
        </div>
      </section>
      <section className="contact-ribbon">
        <div className="container">
          <span className="contact-ribbon-icon">
            <MessageCircle aria-hidden="true" size={28} />
          </span>
          <div>
            <h2>Ada pertanyaan atau butuh bantuan?</h2>
            <p>
              Temukan informasi kontak dan kunjungi kantor Kelurahan Watundehoa.
            </p>
          </div>
          <Link href="/kontak" className="navy-button">
            Hubungi kelurahan <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
