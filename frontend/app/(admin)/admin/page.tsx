"use client";

import Link from "next/link";
import { ArrowUpRight, Plus, Clock3, Sparkles } from "lucide-react";
import {
  NewsPaperSvg,
  DocumentSealSvg,
  MegaphoneSvg,
  CalendarEventSvg,
  GalleryPhotoSvg,
  UsersShieldSvg,
  InboxMailSvg,
  BuildingShieldSvg,
  KalosaraEmblemSvg,
} from "@/components/admin/admin-icons";
import { useAuth } from "@/features/auth/auth-provider";
import {
  AdminLoading,
  AdminError,
  AdminEmptyState,
} from "@/components/admin/feedback";
import { adminLinks } from "@/components/admin/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "../_components/ui";
import { useResponseDashboard } from "./hooks/crud";

const metrics = [
  {
    key: "published",
    label: "Berita Terbit",
    subtitle: "Tayang di portal publik",
    icon: NewsPaperSvg,
    href: "/admin/berita",
    tone: "bg-gradient-to-b from-sky-400 to-sky-600 text-white",
  },
  {
    key: "draft",
    label: "Draft Berita",
    subtitle: "Menunggu penyuntingan",
    icon: DocumentSealSvg,
    href: "/admin/berita",
    tone: "bg-gradient-to-b from-cyan-400 to-sky-500 text-white",
  },
  {
    key: "announcements",
    label: "Pengumuman",
    subtitle: "Siaran resmi warga",
    icon: MegaphoneSvg,
    href: "/admin/konten#announcements",
    tone: "bg-gradient-to-b from-blue-400 to-sky-600 text-white",
  },
  {
    key: "events",
    label: "Agenda Kegiatan",
    subtitle: "Jadwal acara kelurahan",
    icon: CalendarEventSvg,
    href: "/admin/konten#events",
    tone: "bg-gradient-to-b from-teal-400 to-cyan-600 text-white",
  },
  {
    key: "media",
    label: "Media Tersimpan",
    subtitle: "Foto & dokumen publik",
    icon: GalleryPhotoSvg,
    href: "/admin/berita",
    tone: "bg-gradient-to-b from-sky-400 to-blue-500 text-white",
  },
  {
    key: "users",
    label: "Total Pengguna",
    subtitle: "Admin, Lurah & Warga",
    icon: UsersShieldSvg,
    href: "/admin/pengguna",
    tone: "bg-gradient-to-b from-indigo-400 to-sky-600 text-white",
  },
] as const;

const shortcutDescriptions: Record<string, string> = {
  "/admin/profil#pengaturan": "Identitas wilayah, kontak & banner utama",
  "/admin/profil#halaman-profil": "Sejarah, visi-misi & struktur organisasi",
  "/admin/pelayanan": "Standar alur & syarat layanan warga",
  "/admin/konten#announcements": "Publikasi maklumat & info penting",
  "/admin/konten#events": "Kalender jadwal kegiatan kelurahan",
  "/admin/wilayah#statistics": "Data kependudukan & potensi wilayah",
};

function activityLabel(action: string) {
  const labels: Record<string, string> = {
    PUBLIC_REQUEST_RECEIVED: "Pesan masyarakat diterima",
    PUBLIC_REQUEST_UPDATED: "Tindak lanjut pesan diperbarui",
    PUBLIC_REQUEST_VIEWED: "Pesan masyarakat ditinjau",
    COMMUNITY_SECTION_SAVED: "Infografis kelurahan diperbarui",
    DEMO_CONTENT_SEEDED: "Konten contoh disiapkan",
    LEGACY_HISTORY_CLARIFIED: "Riwayat kelurahan diperbarui",
    LEGACY_SETTINGS_IMPORTED: "Identitas website diperbarui",
    LEGACY_DOCUMENT_IMPORTED: "Dokumen website lama ditambahkan",
    LEGACY_GALLERY_IMPORTED: "Galeri website lama ditambahkan",
    LEGACY_NEWS_IMPORTED: "Berita website lama ditambahkan",
    LEGACY_OFFICIAL_IMPORTED: "Arsip aparatur ditambahkan",
    LEGACY_POTENTIAL_IMPORTED: "Potensi kelurahan ditambahkan",
    LEGACY_FACILITY_IMPORTED: "Fasilitas publik ditambahkan",
    LEGACY_PROFILE_IMPORTED: "Profil kelurahan diperbarui",
    LEGACY_MEDIA_IMPORTED: "Media website lama ditambahkan",
    MEDIA_UPLOADED: "Media baru diunggah",
    NEWS_CREATED: "Berita baru dibuat",
    NEWS_UPDATED: "Berita diperbarui",
    NEWS_PUBLISHED: "Berita diterbitkan",
    PROFILE_PAGE_SAVED: "Halaman profil diperbarui",
    PROFILE_SETTINGS_SAVED: "Pengaturan website diperbarui",
    PROFILE_OFFICIAL_SAVED: "Data aparatur diperbarui",
    CONTENT_SAVED: "Konten informasi diperbarui",
    STAFF_PROVISIONED: "Akun petugas dibuat",
  };
  return labels[action] ?? action.toLowerCase().replaceAll("_", " ");
}

export default function AdminDashboardPage() {
  const auth = useAuth();
  const data = useResponseDashboard();
  const isAdmin = auth.user?.role === "ADMIN_KELURAHAN";

  return (
    <main id="konten" className="admin-dashboard min-w-0 space-y-6">
      {/* ── Welcome Banner (EduSetara Style + Soft Sky-Azure Blue Theme) ── */}
      <div className="glass-card relative overflow-hidden p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-linear-to-br from-sky-300/25 to-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-2 z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-300/75 text-sky-900 text-xs font-extrabold">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            KALOSARA Digital • Pemerintah Kelurahan Watundehoa
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Selamat datang di Pusat Kendali Digital Kelurahan!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Pantau metrik publikasi berita, pengumuman warga, layanan administrasi, data kependudukan, dan kotak masuk masyarakat secara terpadu.
          </p>
        </div>

        {/* Kalosara System Companion Badge */}
        <div className="flex flex-wrap items-center gap-3 z-10 shrink-0">
          <div className="flex items-center gap-3.5 bg-white/90 px-4 py-2.5 rounded-2xl border border-sky-200/80 shadow-xs">
            <KalosaraEmblemSvg size={42} />
            <div className="flex flex-col">
              <span className="text-[11px] font-extrabold text-sky-900 uppercase tracking-wider">
                Kalosara Sistem
              </span>
              <span className="text-xs font-semibold text-slate-600">
                Portal Layanan Terpadu
              </span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                ● Seluruh modul aktif
              </span>
            </div>
          </div>

          {isAdmin && (
            <Link href="/admin/berita">
              <Button variant="primary" leftIcon={<Plus size={16} />}>
                Tulis Berita Baru
              </Button>
            </Link>
          )}
        </div>
      </div>

      {data.isPending && <AdminLoading variant="dashboard" />}
      {data.isError && (
        <AdminError error={data.error} onRetry={() => void data.refetch()} />
      )}

      {data.data && (
        <>
          {/* ── Summary Metrics Grid ── */}
          <dl className="admin-metrics">
            {metrics.map(({ key, label, subtitle, icon: IconComp, tone, href }) => (
              <div key={key} className="admin-metric group">
                <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-sky-500/10 blur-xl transition-transform group-hover:scale-125" />
                <span className={`admin-metric-icon ${tone}`}>
                  <IconComp size={20} strokeWidth={2} />
                </span>
                <dt className="admin-metric-label">{label}</dt>
                <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                  {subtitle}
                </p>
                <dd className="admin-metric-value">
                  {data.data[key].toLocaleString("id-ID")}
                </dd>
                {isAdmin && (
                  <Link href={href} className="admin-metric-link">
                    <span>Kelola modul</span>
                    <ArrowUpRight
                      size={14}
                      strokeWidth={2.2}
                      className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </Link>
                )}
              </div>
            ))}
          </dl>

          {/* ── 2-Column Activity & Quick Shortcuts ── */}
          <div
            className={`admin-dashboard-panels ${isAdmin ? "admin-dashboard-panels-pair" : ""}`}
          >
            {/* Activity Timeline Glass Card */}
            <Card padding="none" className="overflow-hidden flex flex-col">
              <div className="flex items-center justify-between border-b border-sky-100/80 px-6 py-5 bg-linear-to-r from-sky-50/60 to-transparent">
                <div className="flex items-center gap-3.5">
                  <div className="glass-icon-box size-10">
                    <Clock3 size={19} strokeWidth={2} />
                  </div>
                  <div>
                    <CardTitle>Riwayat Aktivitas Terbaru</CardTitle>
                    <p className="text-xs font-medium text-slate-500">
                      Log pembaruan langsung pada portal kelurahan
                    </p>
                  </div>
                </div>
                <Badge variant="sky" dot>
                  Live Log
                </Badge>
              </div>

              {!data.data.activity.length ? (
                <div className="p-6">
                  <AdminEmptyState
                    title="Belum ada aktivitas"
                    description="Riwayat pembaruan konten akan ditampilkan di sini."
                  />
                </div>
              ) : (
                <ul className="admin-activity-list divide-y divide-sky-100/60 px-6">
                  {data.data.activity.map((item) => {
                    const isNews = item.action.startsWith("NEWS_");
                    const isMedia = item.action.startsWith("MEDIA_");
                    const isProfile = item.action.startsWith("PROFILE_");
                    const isRequest = item.action.startsWith("PUBLIC_REQUEST_");

                    const ActIcon = isNews
                      ? NewsPaperSvg
                      : isMedia
                        ? GalleryPhotoSvg
                        : isProfile
                          ? BuildingShieldSvg
                          : isRequest
                            ? InboxMailSvg
                            : DocumentSealSvg;

                    const iconStyle = isNews
                      ? "bg-sky-50 text-sky-600 border-sky-200/80"
                      : isMedia
                        ? "bg-cyan-50 text-cyan-600 border-cyan-200/80"
                        : isProfile
                          ? "bg-indigo-50 text-indigo-600 border-indigo-200/80"
                          : isRequest
                            ? "bg-amber-50 text-amber-600 border-amber-200/80"
                            : "bg-emerald-50 text-emerald-600 border-emerald-200/80";

                    return (
                      <li
                        key={item.id}
                        className="flex items-center gap-3.5 py-3.5 hover:bg-sky-50/40 -mx-6 px-6 transition-colors"
                      >
                        <span
                          className={`grid size-9 shrink-0 place-items-center rounded-xl border ${iconStyle} shadow-2xs`}
                        >
                          <ActIcon size={17} strokeWidth={2} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                            {activityLabel(item.action)}
                          </p>
                          <time
                            dateTime={item.createdAt}
                            className="mt-0.5 block text-[11px] font-medium text-slate-400"
                          >
                            {new Intl.DateTimeFormat("id-ID", {
                              dateStyle: "medium",
                              timeStyle: "short",
                              timeZone: "Asia/Makassar",
                            }).format(new Date(item.createdAt))}{" "}
                            WITA
                          </time>
                        </div>
                        {item.resourceType && (
                          <Badge variant="info" size="sm">
                            {item.resourceType}
                          </Badge>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            {/* Quick Shortcuts Glass Card */}
            {isAdmin && (
              <Card className="flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <div className="flex items-center gap-3.5">
                      <div className="glass-icon-box size-10">
                        <Sparkles size={19} strokeWidth={2} />
                      </div>
                      <div>
                        <CardTitle>Pintasan Pengelolaan Cepat</CardTitle>
                        <p className="text-xs font-medium text-slate-500">
                          Akses langsung ke modul utama portal kelurahan
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <div className="admin-shortcut-grid">
                    {adminLinks
                      .filter((item) =>
                        [
                          "/admin/profil#pengaturan",
                          "/admin/profil#halaman-profil",
                          "/admin/pelayanan",
                          "/admin/konten#announcements",
                          "/admin/konten#events",
                          "/admin/wilayah#statistics",
                        ].includes(item.href),
                      )
                      .map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="group relative flex flex-col justify-between gap-3 rounded-2xl border border-sky-200/75 bg-white/85 p-4 shadow-2xs transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white hover:shadow-md hover:shadow-sky-500/10"
                        >
                          <div className="flex items-center justify-between">
                            <span className="glass-icon-box size-10 rounded-xl transition-all group-hover:scale-105">
                              <item.icon size={20} strokeWidth={2} />
                            </span>
                            <ArrowUpRight
                              size={16}
                              strokeWidth={2.2}
                              className="text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-sky-600"
                            />
                          </div>
                          <div>
                            <span className="block text-sm font-extrabold text-slate-800 group-hover:text-sky-700 transition-colors">
                              {item.label}
                            </span>
                            <span className="mt-0.5 block text-[11px] font-medium text-slate-500 line-clamp-1">
                              {shortcutDescriptions[item.href] ??
                                "Kelola modul website"}
                            </span>
                          </div>
                        </Link>
                      ))}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl border border-sky-200/70 bg-linear-to-r from-sky-50/90 to-blue-50/80 px-4 py-3 text-xs text-sky-900">
                  <span className="font-semibold">
                    Ingin melihat tampilan langsung untuk warga?
                  </span>
                  <Link
                    href="/"
                    target="_blank"
                    className="inline-flex items-center gap-1 font-extrabold text-sky-700 hover:text-sky-900"
                  >
                    <span>Buka Website</span>
                    <ArrowUpRight size={14} strokeWidth={2.2} />
                  </Link>
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </main>
  );
}
