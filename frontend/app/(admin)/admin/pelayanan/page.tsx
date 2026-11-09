"use client";

import { AdminLoading, AdminError } from "@/components/admin/feedback";
import { ServiceBadgeSvg } from "@/components/admin/admin-icons";
import { AdminAccess } from "@/features/cms/admin-access";
import { PageHeader } from "@/app/(admin)/_components/ui";
import { useResponseMaster } from "./hooks/crud";
import { FormPelayananWorkspace } from "./components/FormPelayananWorkspace";

function Workspace() {
  const query = useResponseMaster();
  return (
    <>
      {query.isPending && <AdminLoading variant="detail" />}
      {query.isError && (
        <AdminError error={query.error} onRetry={() => void query.refetch()} />
      )}
      {query.data && (
        <FormPelayananWorkspace
          page={query.data.pages.find((p) => p.slug === "pelayanan")}
        />
      )}
    </>
  );
}

export default function PelayananPage() {
  return (
    <main className="min-w-0 space-y-6">
      <PageHeader
        title="Panduan Pelayanan"
        description="Perbarui persyaratan berkas, prosedur administrasi, dan alur pelayanan kantor kelurahan."
        icon={ServiceBadgeSvg}
        badge={{ text: "Standar Pelayanan Warga", variant: "sky" }}
      />
      <AdminAccess>
        <Workspace />
      </AdminAccess>
    </main>
  );
}
