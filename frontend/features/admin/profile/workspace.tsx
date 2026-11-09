"use client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminLoading, AdminError } from "@/components/admin/feedback";
import { BuildingShieldSvg } from "@/components/admin/admin-icons";
import { useQuery } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import Editor, { type Data } from "./editor";

export default function ProfileAdmin() {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const query = useQuery({
    queryKey: ["user", auth.user?.id, "profile-editor"],
    enabled:
      auth.status === "AUTHENTICATED" && auth.user?.role === "ADMIN_KELURAHAN",
    queryFn: () => runtime.request<Data>("/admin/profile"),
  });
  return (
    <main id="konten" tabIndex={-1} className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Profil & Pengaturan Website"
        description="Atur identitas resmi kelurahan, kontak darurat, logo, gambar beranda, naskah profil, dan struktur aparatur."
        icon={BuildingShieldSvg}
      />
      {auth.user?.role !== "ADMIN_KELURAHAN" && (
        <div role="alert" className="glass-card p-6 text-sm font-semibold text-amber-800 border-amber-200/80 bg-amber-50/75">
          Akun Anda tidak memiliki izin untuk mengelola profil.
        </div>
      )}
      {auth.user?.role === "ADMIN_KELURAHAN" && query.isPending && (
        <AdminLoading
          variant="cards"
          label="Memuat pengaturan profil kelurahan…"
        />
      )}
      {query.isError && (
        <AdminError error={query.error} onRetry={() => void query.refetch()} />
      )}
      {query.data && auth.user?.role === "ADMIN_KELURAHAN" && (
        <Editor
          key={auth.user.id}
          data={query.data}
          reload={() => void query.refetch()}
        />
      )}
    </main>
  );
}
