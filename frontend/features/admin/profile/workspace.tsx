"use client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsError as message } from "@/features/cms/client";
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
    <main id="konten" tabIndex={-1} className="min-w-0">
      <AdminPageHeader
        title="Profil & pengaturan"
        description="Atur identitas, kontak, gambar beranda, profil, dan aparatur."
        icon={Settings}
      />
      {auth.user?.role !== "ADMIN_KELURAHAN" && (
        <p role="alert">
          Akun Anda tidak memiliki izin untuk mengelola profil.
        </p>
      )}
      {auth.user?.role === "ADMIN_KELURAHAN" && query.isPending && (
        <p role="status">Memuat pengaturan…</p>
      )}
      {query.isError && (
        <p role="alert">
          {message(query.error)}{" "}
          <button onClick={() => void query.refetch()}>Coba lagi</button>
        </p>
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
