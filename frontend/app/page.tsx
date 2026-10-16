import { getPublicProfile } from "@/lib/profile";
import { getSiteSettings } from "@/lib/site-settings";
import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarDays,
  FileText,
  Images,
  Landmark,
  Megaphone,
  MessageCircle,
  Newspaper,
  Users,
  ChartNoAxesCombined,
  LayoutGrid,
  ShieldCheck,
  ClipboardList,
  Building2,
} from "lucide-react";
import { siteIdentity } from "@/lib/site-identity";
import {
  referenceNews,
  referenceAnnouncements,
  referenceAgenda,
} from "@/lib/reference-content";
const shortcuts = [
  { title: "Ajukan Layanan", href: "/pelayanan", icon: Landmark, tone: "red" },
  { title: "Profil Kelurahan", href: "/profil", icon: FileText, tone: "blue" },
  {
    title: "Informasi Publik",
    href: "/informasi-publik",
    icon: FileText,
    tone: "blue",
  },
  {
    title: "Agenda Kegiatan",
    href: "/agenda",
    icon: CalendarDays,
    tone: "green",
  },
  {
    title: "Pengaduan Pelayanan",
    href: "/kontak",
    icon: Megaphone,
    tone: "orange",
  },
  { title: "Galeri Kegiatan", href: "/galeri", icon: Images, tone: "gold" },
  {
    title: "Statistik Kelurahan",
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
  eyebrow?: string;
  title: string;
  href: string;
}) {
  return (
    <div className="portal-section-heading">
      <span className="section-icon">
        <Icon aria-hidden="true" size={20} />
      </span>
      <div>
        {eyebrow && <p className="mini-label">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      <Link href={href}>
        Lihat semua <ArrowRight aria-hidden="true" size={14} />
      </Link>
    </div>
  );
}
const services = [
  { title: "Surat Keterangan Domisili", icon: FileText, tone: "green" },
  { title: "Surat Keterangan Usaha", icon: Building2, tone: "green" },
  { title: "Surat Keterangan Tidak Mampu", icon: Users, tone: "gold" },
  { title: "Surat Pengantar Nikah", icon: ShieldCheck, tone: "green" },
  { title: "Surat Keterangan Kehilangan", icon: FileText, tone: "gold" },
  { title: "Lihat Semua Layanan", icon: LayoutGrid, tone: "blue" },
];
const announcementIcons = [
  CalendarDays,
  ShieldCheck,
  ClipboardList,
  ClipboardList,
];
export default async function Home() {
  const [settings, profile] = await Promise.all([
    getSiteSettings(),
    getPublicProfile(),
  ]);
  const leader = profile.officials.find(
    (o) => o.position.toLowerCase() === "lurah",
  );
  const [featured, ...news] = referenceNews;
  return (
    <main id="konten" tabIndex={-1} className="portal-home reference-fidelity">
      <section className="modern-hero" aria-labelledby="hero-title">
        <Image
          src={settings.heroUrl ?? siteIdentity.officePhoto}
          alt=""
          fill
          unoptimized
          preload
          className="modern-hero-bg"
          sizes="100vw"
        />
        <div className="modern-hero-shade" aria-hidden="true" />
        <div className="reference-hero-scene">
          <Image
            src={settings.heroUrl ?? "/images/reference/hero-right.webp"}
            alt="Komposisi foto kantor, bendera Merah Putih dan Lurah Watundehoa pada desain pilihan pengguna"
            fill
            unoptimized
            preload
            className="object-fill"
            sizes="60vw"
          />
        </div>
        <div className="container modern-hero-inner">
          <div className="modern-hero-copy">
            <p className="mini-label text-[#ffcf24]">{settings.name}</p>
            <h1 id="hero-title">
              Lebih dekat.
              <br />
              Lebih mudah.
              <br />
              <span>Untuk warga.</span>
            </h1>
            <p className="hero-intro">
              Portal informasi {settings.name}
              <br />
              {settings.district ?? "Kecamatan Puriala"},{" "}
              {settings.regency ?? "Kabupaten Konawe"}.
              <br />
              Hadir untuk memberikan pelayanan yang transparan,
              <br className="hidden sm:block" /> cepat, dan mudah diakses oleh
              seluruh masyarakat.
            </p>
            <div className="hero-actions">
              <Link href="/profil" className="yellow-button">
                Informasi Kelurahan <ArrowRight aria-hidden="true" size={16} />
              </Link>
              <Link href="/pelayanan" className="white-button">
                Ajukan Layanan <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
          </div>
          <div className="hero-leader-photo">
            <Image
              src={leader?.photoUrl ?? siteIdentity.leaderPhoto}
              alt="AMIRULAH, S.Si, Lurah Watundehoa"
              fill
              unoptimized
              loading="eager"
              className="object-cover object-top"
              sizes="55vw"
            />
          </div>
          <div className="hero-leader-card">
            <p className="font-extrabold">
              {leader?.name ?? siteIdentity.leader}
            </p>
            <p className="mt-0.5 text-xs">Lurah Watundehoa</p>
            <div className="reference-quote">
              <span aria-hidden="true">“</span>
              <p>
                Bersama warga, kita wujudkan Kelurahan Watundehoa yang maju,
                nyaman dan sejahtera.
              </p>
            </div>
          </div>
        </div>
        <svg
          className="reference-hero-wave"
          viewBox="0 0 864 130"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 0C60 15 55 105 112 81C180 50 200 100 240 120L864 130H0Z"
            fill="#ffca25"
          />
          <path
            d="M0 62C80 11 110 137 190 109L242 130H0Z"
            fill="#ffdf77"
            opacity=".8"
          />
          <path d="M864 66C820 58 787 88 750 130H864Z" fill="#ffd82f" />
        </svg>
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
                <Icon aria-hidden="true" size={24} />
              </span>
              <span className="quick-tile-title">{title}</span>
              <span className="round-arrow">
                <ArrowRight aria-hidden="true" size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <p className="container reference-demo-note">
        Pratinjau desain: berita, pengumuman, angka dan agenda di bawah adalah
        contoh dari gambar, belum terhubung ke publikasi backend.
      </p>
      <section className="container portal-news-grid section-space">
        <div>
          <SectionHeading
            icon={Newspaper}
            eyebrow="Berita terbaru"
            title="Berita Terbaru"
            href="/berita"
          />
          <div className="news-content">
            <Link
              href={`/berita?contoh=${featured.slug}`}
              className="reference-news-feature"
            >
              <div className="reference-news-photo">
                <Image
                  src={featured.image}
                  alt="Contoh foto berita dari gambar desain"
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="40vw"
                />
              </div>
              <div className="reference-news-title">
                <span className="reference-date-box">
                  <b>15</b>
                  <small>Okt 2026</small>
                </span>
                <h3>{featured.title}</h3>
                <span className="round-arrow">
                  <ArrowRight aria-hidden="true" size={17} />
                </span>
              </div>
              <p>{featured.excerpt}</p>
            </Link>
            <div className="reference-news-list">
              {news.map((item) => (
                <Link key={item.slug} href={`/berita?contoh=${item.slug}`}>
                  <Image
                    src={item.image}
                    alt="Ilustrasi berita contoh pada desain"
                    width={90}
                    height={60}
                    unoptimized
                    className="object-cover"
                  />
                  <span>
                    <time>{item.date}</time>
                    <h3>{item.title}</h3>
                  </span>
                  <ArrowRight aria-hidden="true" size={14} />
                </Link>
              ))}
            </div>
          </div>
        </div>
        <aside>
          <SectionHeading
            icon={Megaphone}
            title="Pengumuman"
            href="/pengumuman"
          />
          <div className="announcement-panel reference-announcements">
            {referenceAnnouncements.map((item, index) => {
              const Icon = announcementIcons[index];
              return (
                <Link
                  key={item.title}
                  href="/pengumuman"
                  className="announcement-link"
                >
                  <span
                    className={`tile-icon tone-${["orange", "green", "blue", "blue"][index]}`}
                  >
                    <Icon aria-hidden="true" size={22} />
                  </span>
                  <span>
                    <time>{item.date}</time>
                    <strong>{item.title}</strong>
                  </span>
                  <span className="round-arrow">
                    <ArrowRight aria-hidden="true" size={14} />
                  </span>
                </Link>
              );
            })}
          </div>
        </aside>
      </section>
      <section className="service-band">
        <Image
          src={siteIdentity.officePhoto}
          alt=""
          fill
          unoptimized
          className="object-cover"
          sizes="100vw"
        />
        <div className="service-band-shade" aria-hidden="true" />
        <div className="container relative">
          <div className="service-band-heading">
            <div>
              <p className="mini-label">Layanan online</p>
              <h2>Urus administrasi, sekarang lebih mudah.</h2>
              <p>
                Kenali persyaratan dan panduan pelayanan kelurahan.
                <br />
                Pengajuan online belum tersedia pada tahap ini.
              </p>
            </div>
            <Link href="/pelayanan" className="yellow-button">
              Ajukan Layanan Sekarang{" "}
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
          <div className="service-tiles">
            {services.map(({ title, icon: Icon, tone }) => (
              <Link key={title} href="/pelayanan">
                <span className={`tile-icon tone-${tone}`}>
                  <Icon aria-hidden="true" size={23} />
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
              <h2>Tentang {settings.name}</h2>
            </div>
          </div>
          <p className="profile-description">
            {settings.name} berada di {settings.district ?? "Kecamatan Puriala"}
            , {settings.regency ?? "Kabupaten Konawe"}. Kami berkomitmen
            memberikan pelayanan prima, transparan, terbuka dan berorientasi
            pada kebutuhan masyarakat.
          </p>
          <Link href="/profil" className="soft-button">
            Kenali Kelurahan Kami <ArrowRight aria-hidden="true" size={14} />
          </Link>
        </div>
        <dl
          className="identity-facts reference-statistics"
          aria-label="Contoh statistik dari gambar desain"
        >
          {[
            { value: "4", label: "Lingkungan", icon: Landmark },
            { value: "1.250+", label: "Jumlah KK", icon: Building2 },
            { value: "3.842+", label: "Jumlah Penduduk", icon: Users },
            { value: "12", label: "RT / RW", icon: Users },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label}>
              <span className="tile-icon tone-blue">
                <Icon aria-hidden="true" size={22} />
              </span>
              <span>
                <dt>{value}</dt>
                <dd>{label}</dd>
              </span>
            </div>
          ))}
        </dl>
        <figure className="reference-profile-image">
          <Image
            src="/images/reference/profile-monument.webp"
            alt="Panel ilustrasi profil dari gambar desain pilihan pengguna"
            fill
            unoptimized
            className="object-cover"
            sizes="25vw"
          />
        </figure>
      </section>
      <section className="container agenda-gallery section-space">
        <div>
          <SectionHeading
            icon={Users}
            eyebrow="Agenda kegiatan"
            title="Agenda Kegiatan"
            href="/agenda"
          />
          <div className="reference-agenda">
            {referenceAgenda.map((item) => (
              <Link key={item.title} href="/agenda">
                <span className="reference-date-box">
                  <b>{item.day}</b>
                  <small>{item.month}</small>
                </span>
                <span>
                  <h3>{item.title}</h3>
                  <p>{item.place}</p>
                </span>
                <span className="round-arrow">
                  <ArrowRight aria-hidden="true" size={15} />
                </span>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <SectionHeading
            icon={Images}
            title="Galeri Kegiatan"
            href="/galeri"
          />
          <div className="reference-gallery">
            {[1, 2, 3, 4, 5].map((index) => (
              <Link
                href="/galeri"
                key={index}
                className={`reference-gallery-${index}`}
              >
                <Image
                  src={`/images/reference/gallery-${index}.webp`}
                  alt={`Ilustrasi kegiatan ${index} dari gambar desain`}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="30vw"
                />
              </Link>
            ))}
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
              Hubungi kami melalui kontak resmi atau datang langsung ke kantor
              kelurahan.
            </p>
          </div>
          <Link href="/kontak" className="navy-button">
            Hubungi Kelurahan <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
