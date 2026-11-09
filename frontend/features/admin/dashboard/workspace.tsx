"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Newspaper,
  FilePenLine,
  Megaphone,
  CalendarDays,
  Images,
  Users,
  ArrowUpRight,
  Plus,
  Clock3,
} from "lucide-react";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  AdminLoading,
  AdminError,
  AdminEmptyState,
} from "@/components/admin/feedback";
import { adminLinks } from "@/components/admin/navigation";
type Activity = {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  createdAt: string;
};
type Summary = {
  published: number;
  draft: number;
  announcements: number;
  events: number;
  media: number;
  users: number;
  activity: Activity[];
};
const metrics = [
  {
    key: "published",
    label: "Berita terbit",
    icon: Newspaper,
    href: "/admin/berita",
    tone: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "draft",
    label: "Draft berita",
    icon: FilePenLine,
    href: "/admin/berita",
    tone: "bg-amber-50 text-amber-600",
  },
  {
    key: "announcements",
    label: "Pengumuman",
    icon: Megaphone,
    href: "/admin/konten#announcements",
    tone: "bg-blue-50 text-blue-600",
  },
  {
    key: "events",
    label: "Agenda kegiatan",
    icon: CalendarDays,
    href: "/admin/konten#events",
    tone: "bg-violet-50 text-violet-600",
  },
  {
    key: "media",
    label: "Media tersimpan",
    icon: Images,
    href: "/admin/berita",
    tone: "bg-sky-50 text-sky-600",
  },
  {
    key: "users",
    label: "Pengguna",
    icon: Users,
    href: "/admin/pengguna",
    tone: "bg-slate-100 text-slate-600",
  },
] as const;
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
export default function Dashboard() {
  const auth = useAuth();
  const { request } = useAuthRuntime();
  const data = useQuery({
    queryKey: ["user", auth.user?.id, "dashboard"],
    queryFn: () => request<Summary>("/admin/dashboard"),
  });
  const isAdmin = auth.user?.role === "ADMIN_KELURAHAN";
  return (
    <main id="konten" className="admin-dashboard min-w-0">
      <AdminPageHeader
        title="Ringkasan kelurahan"
        description="Selamat datang. Pantau konten dan kelola informasi untuk warga."
        icon={LayoutDashboard}
      >
        {isAdmin && (
          <Link
            href="/admin/berita"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            <Plus size={16} />
            Kelola berita
          </Link>
        )}
      </AdminPageHeader>
      {data.isPending && <AdminLoading />}
      {data.isError && (
        <AdminError error={data.error} onRetry={() => void data.refetch()} />
      )}{" "}
      {data.data && (
        <>
          <dl className="admin-metrics">
            {metrics.map(({ key, label, icon: Icon, tone, href }) => (
              <div key={key} className="admin-metric">
                <span className={`admin-metric-icon ${tone}`}>
                  <Icon size={18} strokeWidth={1.7} />
                </span>
                <dt className="admin-metric-label">{label}</dt>
                <dd className="admin-metric-value">
                  {data.data[key].toLocaleString("id-ID")}
                </dd>
                {isAdmin && (
                  <Link href={href} className="admin-metric-link">
                    Lihat detail
                    <ArrowUpRight size={12} />
                  </Link>
                )}
              </div>
            ))}
          </dl>
          <div
            className={`admin-dashboard-panels ${isAdmin ? "admin-dashboard-panels-pair" : ""}`}
          >
            <section className="admin-activity-panel overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
                <Clock3 size={18} className="text-slate-500" />
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-800">
                    Aktivitas terbaru
                  </h2>
                  <p className="mt-1 text-[13px] text-slate-500">
                    Pembaruan terakhir pada website kelurahan
                  </p>
                </div>
              </div>
              {!data.data.activity.length ? (
                <div className="px-6">
                  <AdminEmptyState
                    title="Belum ada aktivitas"
                    description="Riwayat pembaruan konten akan ditampilkan di sini."
                  />
                </div>
              ) : (
                <ul className="admin-activity-list divide-y divide-slate-100 px-6">
                  {data.data.activity.map((item) => {
                    const isNews = item.action.startsWith("NEWS_");
                    const isMedia = item.action.startsWith("MEDIA_");
                    const isProfile = item.action.startsWith("PROFILE_");
                    const isRequest = item.action.startsWith("PUBLIC_REQUEST_");
                    const dotColor = isNews
                      ? "bg-blue-500"
                      : isMedia
                        ? "bg-sky-500"
                        : isProfile
                          ? "bg-purple-500"
                          : isRequest
                            ? "bg-amber-500"
                            : "bg-emerald-500";

                    return (
                      <li key={item.id} className="flex items-start gap-3 py-4 hover:bg-slate-50/50 -mx-6 px-6 transition-colors">
                        <span className={`mt-2 size-2 shrink-0 rounded-full ${dotColor}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 break-words">
                            {activityLabel(item.action)}
                          </p>
                          <time
                            dateTime={item.createdAt}
                            className="mt-1 block text-xs text-slate-400"
                          >
                            {new Intl.DateTimeFormat("id-ID", {
                              dateStyle: "medium",
                              timeStyle: "short",
                              timeZone: "Asia/Makassar",
                            }).format(new Date(item.createdAt))}{" "}
                            WITA
                          </time>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
            {isAdmin && (
              <section className="admin-shortcuts rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-[15px] font-semibold text-slate-800">
                  Mulai mengelola
                </h2>
                <p className="mt-1 text-[13px] text-slate-500">
                  Akses cepat ke konten website
                </p>
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
                        className="group flex items-center gap-3 rounded-lg border border-slate-100 px-4 py-3.5 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <item.icon
                          size={17}
                          strokeWidth={1.5}
                          className="text-slate-500"
                        />
                        <span className="flex-1 text-sm font-medium text-slate-700">
                          {item.label}
                        </span>
                        <ArrowUpRight
                          size={13}
                          className="text-slate-300 group-hover:text-primary"
                        />
                      </Link>
                    ))}
                </div>
              </section>
            )}
          </div>
        </>
      )}
    </main>
  );
}
