"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  FileText,
  Building,
} from "lucide-react";
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

  const displayName = query.data?.user.profile?.displayName ?? "Warga";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">
          Portal Administrasi Mandiri
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          Dashboard masyarakat
        </h1>
      </div>

      {query.isPending && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500" role="status">
          <p className="animate-pulse">Memuat data akun warga…</p>
        </div>
      )}

      {query.isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800" role="alert">
          <p className="font-semibold">{cmsError(query.error)}</p>
          <button
            onClick={async () => {
              await runtime.bootstrap();
              await query.refetch();
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700"
          >
            Coba lagi
          </button>
        </div>
      )}

      {query.data && (
        <>
          <section className="cms-content-row rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div
                  aria-hidden="true"
                  className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary text-xl font-bold text-white shadow-xs"
                >
                  {initials || <User size={24} />}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-primary sm:text-2xl">
                      Selamat datang, {displayName}
                    </h2>
                    {query.data.user.verifiedAt ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        Terverifikasi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                        <AlertCircle size={12} className="text-amber-600" />
                        Belum Terverifikasi
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted">{query.data.user.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/masyarakat/profil"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Kelola profil saya
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/masyarakat/keamanan"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Keamanan akun
                </Link>
              </div>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-primary">
                <ShieldCheck size={20} />
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Peran Pengguna
              </p>
              <p className="mt-1 text-base font-bold text-primary">Masyarakat</p>
              <p className="mt-1 text-xs text-muted">Akses mandiri informasi & layanan warga</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-primary">
                <FileText size={20} />
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Kontak Akun
              </p>
              <p className="mt-1 truncate text-base font-bold text-primary">
                {query.data.user.phone ?? "Belum ada no. telp"}
              </p>
              <p className="mt-1 text-xs text-muted">
                {query.data.user.verifiedAt ? "Terverifikasi oleh kelurahan" : "Verifikasi di kantor"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-primary">
                <Building size={20} />
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status Pelayanan
              </p>
              <p className="mt-1 text-base font-bold text-primary">Tahap 01 (Fondasi)</p>
              <p className="mt-1 text-xs text-muted">Pelayanan surat saat ini langsung di kantor</p>
            </div>
          </div>
        </>
      )}

      <div className="cms-content-list space-y-4">
        <ServiceCatalogPlaceholder availability={{ state: "NOT_ACTIVE" }} />
        <SubmissionStatusPlaceholder availability={{ state: "NOT_ACTIVE" }} />
      </div>
    </div>
  );
}

