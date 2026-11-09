"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-provider";
import { AdminLoading, AdminError } from "@/components/admin/feedback";
import { InfographicPieSvg } from "@/components/admin/admin-icons";
import { communitySections, type SectionSlug } from "@/lib/community";
import { PageHeader } from "@/app/(admin)/_components/ui";
import { useResponseMaster } from "./hooks/crud";
import { FormInfografisEditor } from "./components/FormInfografisEditor";

export default function InfografisPage() {
  const auth = useAuth();
  const [slug, setSlug] = useState<SectionSlug>("anggaran");

  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1);
      if (Object.hasOwn(communitySections, hash)) setSlug(hash as SectionSlug);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const data = useResponseMaster(slug);

  return (
    <main id="konten" className="min-w-0 space-y-6">
      <PageHeader
        title="Infografis & Program"
        description="Kelola data transparansi anggaran, bantuan sosial, dan penanganan stunting pada portal publik."
        icon={InfographicPieSvg}
        badge={{ text: "Transparansi Publik", variant: "sky" }}
      />
      {auth.user?.role !== "ADMIN_KELURAHAN" ? (
        <div
          role="alert"
          className="glass-card p-6 text-sm font-semibold text-amber-800 border-amber-200/80 bg-amber-50/75"
        >
          Bagian ini khusus administrator.
        </div>
      ) : (
        <>
          <nav className="cms-channel-tabs" aria-label="Bagian infografis">
            {Object.entries(communitySections).map(([key, c]) => (
              <button
                key={key}
                type="button"
                aria-pressed={slug === key}
                onClick={() => {
                  if (key === slug) return;
                  if (
                    window.confirm(
                      "Pastikan perubahan sudah disimpan sebelum berpindah. Lanjutkan?",
                    )
                  ) {
                    window.location.hash = key;
                    setSlug(key as SectionSlug);
                  }
                }}
              >
                {c.title}
              </button>
            ))}
          </nav>
          {data.isPending && <AdminLoading variant="cards" />}
          {data.isError && (
            <AdminError
              error={data.error}
              onRetry={() => void data.refetch()}
            />
          )}
          {data.data && (
            <FormInfografisEditor
              key={slug}
              slug={slug}
              initial={data.data.section}
            />
          )}
        </>
      )}
    </main>
  );
}
