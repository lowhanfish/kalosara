"use client";
import Link from "next/link";
import { adminLinks } from "@/features/cms/admin-shell";
import { useQuery } from "@tanstack/react-query";
import { AdminAccess } from "@/features/cms/admin-access";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsError } from "@/features/cms/client";
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
function SummaryDashboard() {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const data = useQuery({
    queryKey: ["user", auth.user?.id, "dashboard"],
    queryFn: () => runtime.request<Summary>("/admin/dashboard"),
    staleTime: 0,
  });
  return (
    <>
      <p>Pantau publikasi, pengguna, dan aktivitas pengelolaan website.</p>
      {data.isPending && <p role="status">Memuat ringkasan…</p>}
      {data.isError && (
        <p role="alert">
          {cmsError(data.error)}{" "}
          <button onClick={() => void data.refetch()}>Coba lagi</button>
        </p>
      )}
      {data.data && (
        <>
          <dl className="cms-dashboard-cards">
            {(
              [
                ["Berita terbit", "published"],
                ["Berita draft", "draft"],
                ["Pengumuman (semua status)", "announcements"],
                ["Agenda (semua status)", "events"],
                ["Media (termasuk arsip)", "media"],
                ["Pengguna terdaftar", "users"],
              ] as const
            ).map(([label, key]) => (
              <div key={key}>
                <dt>{label}</dt>
                <dd>{data.data[key]}</dd>
              </div>
            ))}
          </dl>
          <h2>Aktivitas CMS terbaru</h2>
          <p>Riwayat pembaruan terbaru oleh pengelola kelurahan.</p>
          {data.data.activity.length === 0 && <p>Belum ada aktivitas CMS.</p>}
          <ul className="cms-content-list">
            {data.data.activity.map((item) => (
              <li className="cms-content-row" key={item.id}>
                <strong>{item.action}</strong>
                <span>
                  {item.resourceType} · {item.resourceId}
                </span>
                <time dateTime={item.createdAt}>
                  {new Date(item.createdAt).toLocaleString("id-ID")}
                </time>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
export default function DashboardPage() {
  const auth = useAuth();
  return (
    <main className="container py-8">
      <h1>Kelola website kelurahan</h1>
      <p className="admin-intro">
        Pilih menu untuk memperbarui informasi yang tampil di website.
      </p>
      {auth.user?.role === "ADMIN_KELURAHAN" && (
        <div className="admin-shortcuts">
          {adminLinks
            .filter(
              (link) => link.group !== "Administrasi" && link.href !== "/admin",
            )
            .slice(0, 11)
            .map((link) => (
              <Link key={link.href} href={link.href}>
                <link.icon size={20} />
                {link.label}
              </Link>
            ))}
        </div>
      )}
      <AdminAccess monitoring>
        <SummaryDashboard />
      </AdminAccess>
    </main>
  );
}
