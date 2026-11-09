"use client";

import { AdminLoading, AdminError } from "@/components/admin/feedback";
import { BuildingShieldSvg } from "@/components/admin/admin-icons";
import { useAuth } from "@/features/auth/auth-provider";
import { PageHeader } from "@/app/(admin)/_components/ui";
import { useResponseMaster } from "./hooks/crud";
import { FormProfilWorkspace } from "./components/FormProfilWorkspace";

export default function ProfilPage() {
  const auth = useAuth();
  const query = useResponseMaster();

  return (
    <main id="konten" tabIndex={-1} className="min-w-0 space-y-6">
      <PageHeader
        title="Profil & Pengaturan Website"
        description="Atur identitas resmi kelurahan, kontak darurat, logo, gambar beranda, naskah profil, dan struktur aparatur."
        icon={BuildingShieldSvg}
        badge={{ text: "Identitas & Organisasi", variant: "sky" }}
      />
      {auth.user?.role !== "ADMIN_KELURAHAN" && (
        <div
          role="alert"
          className="glass-card p-6 text-sm font-semibold text-amber-800 border-amber-200/80 bg-amber-50/75"
        >
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
        <FormProfilWorkspace
          key={auth.user.id}
          data={query.data}
          reload={() => void query.refetch()}
        />
      )}
    </main>
  );
}
