"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import type { Account } from "@/features/account/client";
import { cmsError } from "@/features/cms/client";
import {
  ServiceCatalogPlaceholder,
  SubmissionStatusPlaceholder,
} from "@/features/account/service-placeholder";
export default function CitizenDashboard() {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const query = useQuery({
    queryKey: ["user", auth.user?.id, "account-profile"],
    queryFn: () => runtime.request<{ user: Account }>("/account/profile"),
  });
  return (
    <>
      <h1>Dashboard masyarakat</h1>
      {query.isPending && <p role="status">Memuat akun…</p>}
      {query.isError && (
        <p role="alert">
          {cmsError(query.error)}{" "}
          <button
            onClick={async () => {
              await runtime.bootstrap();
              await query.refetch();
            }}
          >
            Coba lagi
          </button>
        </p>
      )}
      {query.data && (
        <section className="cms-content-row">
          <div>
            <h2>
              Selamat datang, {query.data.user.profile?.displayName ?? "warga"}
            </h2>
            <p>{query.data.user.email}</p>
            <Link href="/masyarakat/profil" className="underline">
              Kelola profil saya
            </Link>
          </div>
        </section>
      )}
      <div className="cms-content-list">
        <ServiceCatalogPlaceholder availability={{ state: "NOT_ACTIVE" }} />
        <SubmissionStatusPlaceholder availability={{ state: "NOT_ACTIVE" }} />
      </div>
    </>
  );
}
