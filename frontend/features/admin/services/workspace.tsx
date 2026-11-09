"use client";
import { AdminLoading, AdminError } from "@/components/admin/feedback";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ServiceBadgeSvg } from "@/components/admin/admin-icons";
import Editor from "./editor";

import { useQuery } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { AdminAccess } from "@/features/cms/admin-access";
import type { ProfilePage } from "@/lib/profile";

function Workspace() {
  const auth = useAuth();
  const { request } = useAuthRuntime();
  const query = useQuery({
    queryKey: ["user", auth.user?.id, "service-page"],
    queryFn: () => request<{ pages: ProfilePage[] }>("/admin/profile"),
  });
  return (
    <>
      {query.isPending && <AdminLoading />}
      {query.isError && (
        <AdminError error={query.error} onRetry={() => void query.refetch()} />
      )}
      {query.data && (
        <Editor page={query.data.pages.find((p) => p.slug === "pelayanan")} />
      )}
    </>
  );
}
export default function Page() {
  return (
    <main className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Panduan Pelayanan"
        description="Perbarui persyaratan berkas, prosedur administrasi, dan alur pelayanan kantor kelurahan."
        icon={ServiceBadgeSvg}
      />
      <AdminAccess>
        <Workspace />
      </AdminAccess>
    </main>
  );
}
