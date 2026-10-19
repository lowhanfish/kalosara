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
    <main id="konten" className="min-w-0">
      <AdminPageHeader
        title="Ringkasan kelurahan"
        description="Selamat datang. Pantau konten dan kelola informasi untuk warga."
        icon={LayoutDashboard}
      >
        {isAdmin && (
          <Link
            href="/admin/berita"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-white hover:bg-primary-hover"
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
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
            {metrics.map(({ key, label, icon: Icon, tone, href }) => (
              <div
                key={key}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/10 sm:p-5"
              >
                <span
                  className={`mb-5 grid size-9 place-items-center rounded-xl ${tone}`}
                >
                  <Icon size={18} strokeWidth={1.7} />
                </span>
                <dt className="text-[11px] font-medium text-slate-500">
                  {label}
                </dt>
                <dd className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {data.data[key].toLocaleString("id-ID")}
                </dd>
                {isAdmin && (
                  <Link
                    href={href}
                    className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] font-medium text-slate-500 hover:text-primary"
                  >
                    Lihat detail
                    <ArrowUpRight size={12} />
                  </Link>
                )}
              </div>
            ))}
          </dl>
          <div
            className={`mt-7 grid gap-6 ${isAdmin ? "xl:grid-cols-[1.2fr_1fr]" : ""}`}
          >
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
                <Clock3 size={18} className="text-slate-400" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">
                    Aktivitas terbaru
                  </h2>
                  <p className="mt-1 text-[11px] text-slate-500">
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
                <ul className="divide-y divide-slate-100 px-6">
                  {data.data.activity.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 py-5">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-amber-400" />
                      <div className="flex-1">
                        <p className="text-xs font-medium capitalize text-slate-700">
                          {activityLabel(item.action)}
                        </p>
                        <time
                          dateTime={item.createdAt}
                          className="mt-1.5 block text-[10px] text-slate-400"
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
                  ))}
                </ul>
              )}
            </section>
            {isAdmin && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-sm font-semibold text-slate-800">
                  Mulai mengelola
                </h2>
                <p className="mt-1 text-[11px] text-slate-500">
                  Akses cepat ke konten website
                </p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
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
                          className="text-slate-400"
                        />
                        <span className="flex-1 text-xs font-medium text-slate-700">
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
