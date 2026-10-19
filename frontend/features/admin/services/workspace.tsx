"use client";
import { AdminLoading, AdminError } from "@/components/admin/feedback";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Landmark } from "lucide-react";
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
    <main className="min-w-0">
      <AdminPageHeader
        title="Panduan pelayanan"
        description="Perbarui persyaratan dan alur pelayanan pada website."
        icon={Landmark}
      />
      <AdminAccess>
        <Workspace />
      </AdminAccess>
    </main>
  );
}
