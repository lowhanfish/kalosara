"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Send,
  History,
} from "lucide-react";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import type { Account } from "@/features/account/client";
import { cmsError } from "@/features/cms/client";
import { KalosaraBanner } from "@/features/persuratan/kalosara-banner";
import { LetterCatalog } from "@/features/persuratan/letter-catalog";
import { LetterHistoryList } from "@/features/persuratan/letter-history-list";
import { LetterRequestModal } from "@/features/persuratan/letter-request-modal";
import {
  getCitizenLetters,
  submitLetterRequest,
  deleteLetterRequest,
} from "@/features/persuratan/client";
import type { LetterType } from "@/features/persuratan/types";

export default function CitizenDashboard() {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const queryClient = useQueryClient();

  // Tab State: 'CATALOG' | 'HISTORY'
  const [activeTab, setActiveTab] = useState<"CATALOG" | "HISTORY">("CATALOG");

  // Selected letter for request modal
  const [selectedType, setSelectedType] = useState<LetterType | null>(null);

  // Success alert state
  const [successTicket, setSuccessTicket] = useState<string | null>(null);

  // Profile Query
  const profileQuery = useQuery({
    queryKey: ["user", auth.user?.id, "account-profile"],
    queryFn: () => runtime.request<{ user: Account }>("/account/profile"),
  });

  // Letters History Query
  const lettersQuery = useQuery({
    queryKey: ["citizen", auth.user?.id, "letters"],
    queryFn: () => getCitizenLetters(),
    enabled: !!auth.user?.id,
  });

  // Submit Mutation
  const submitMutation = useMutation({
    mutationFn: async ({
      data,
      attachments,
    }: {
      data: Record<string, unknown>;
      attachments: File[];
    }) => {
      // Get CSRF Token
      const csrfRes = await fetch("/api/v1/auth/csrf");
      const csrfJson = await csrfRes.json();
      const csrfToken = csrfJson.data?.csrfToken;
      return submitLetterRequest(data, attachments, csrfToken);
    },
    onSuccess: (newLetter) => {
      queryClient.invalidateQueries({ queryKey: ["citizen", auth.user?.id, "letters"] });
      setSuccessTicket(newLetter.ticketNumber);
      setActiveTab("HISTORY");
      setSelectedType(null);
    },
  });

  // Delete / Cancel Mutation
  const deleteMutation = useMutation({
    mutationFn: async (letterId: string) => {
      const csrfRes = await fetch("/api/v1/auth/csrf");
      const csrfJson = await csrfRes.json();
      const csrfToken = csrfJson.data?.csrfToken;
      return deleteLetterRequest(letterId, csrfToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizen", auth.user?.id, "letters"] });
    },
  });

  const displayName = profileQuery.data?.user.profile?.displayName ?? "Warga";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const lettersList = lettersQuery.data ?? [];
  const activeCount = lettersList.filter((l) => l.status !== "SIGNED").length;

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header Banner KALOSARA */}
      <KalosaraBanner />

      {/* Profile error message if any */}
      {profileQuery.isError && (
        <div
          className="portal-card rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800"
          role="alert"
        >
          <p className="font-semibold">{cmsError(profileQuery.error)}</p>
          <button
            onClick={async () => {
              await runtime.bootstrap();
              await profileQuery.refetch();
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* 2. Welcome & Account Overview Card */}
      {profileQuery.data && (
        <section className="portal-card rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                aria-hidden="true"
                className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 text-xl font-bold text-white shadow-md shadow-sky-600/20"
              >
                {initials || <User size={24} />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">
                    Selamat datang, {displayName}
                  </h2>
                  {profileQuery.data.user.verifiedAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      Warga Terverifikasi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                      <AlertCircle size={12} className="text-amber-600" />
                      Akun Terdaftar
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {profileQuery.data.user.email} • {profileQuery.data.user.phone ?? "No. HP belum terdaftar"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/masyarakat/profil"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
              >
                <span>Kelola Profil</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/masyarakat/keamanan"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
              >
                Keamanan
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Success notification banner after submitting */}
      {successTicket && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white">
              <CheckCircle2 size={18} />
            </span>
            <div>
              <p className="text-sm font-bold">
                Permohonan Surat Berhasil Dikirim!
              </p>
              <p className="text-xs text-emerald-700">
                Nomor Tiket Anda:{" "}
                <strong className="font-mono">{successTicket}</strong>. Permohonan telah masuk ke antrean verifikasi Admin Kelurahan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSuccessTicket(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 px-2 py-1"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 3. Navigation Tabs: Ajukan Surat vs Riwayat Saya */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("CATALOG")}
            className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-extrabold transition-all duration-200 ${
              activeTab === "CATALOG"
                ? "bg-sky-600 text-white shadow-md shadow-sky-600/25"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Send size={14} />
            <span>Ajukan Surat Baru</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                activeTab === "CATALOG"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              10 Layanan
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("HISTORY")}
            className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-extrabold transition-all duration-200 ${
              activeTab === "HISTORY"
                ? "bg-sky-600 text-white shadow-md shadow-sky-600/25"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <History size={14} />
            <span>Riwayat Permohonan Saya</span>
            {lettersList.length > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${
                  activeTab === "HISTORY"
                    ? "bg-white/20 text-white"
                    : "bg-sky-100 text-sky-800"
                }`}
              >
                {lettersList.length}
              </span>
            )}
          </button>
        </div>

        {activeCount > 0 && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            <span className="size-2 rounded-full bg-amber-500 animate-ping" />
            {activeCount} permohonan sedang diproses
          </span>
        )}
      </div>

      {/* 4. Tab Content */}
      {activeTab === "CATALOG" ? (
        <LetterCatalog
          onSelectLetter={(type) => {
            setSelectedType(type);
          }}
        />
      ) : (
        <LetterHistoryList
          letters={lettersList}
          isLoading={lettersQuery.isLoading}
          onOpenReapply={(letter) => {
            setSelectedType(letter.type);
          }}
          onDeleteLetter={async (letterId) => {
            await deleteMutation.mutateAsync(letterId);
          }}
        />
      )}

      {/* 5. Request Modal ("TAMBAH DATA") */}
      {selectedType && (
        <LetterRequestModal
          type={selectedType}
          onClose={() => setSelectedType(null)}
          onSubmit={async (formData, attachments) => {
            await submitMutation.mutateAsync({ data: formData, attachments });
          }}
          initialUserData={{
            displayName: profileQuery.data?.user.profile?.displayName,
            phone: profileQuery.data?.user.phone,
            email: profileQuery.data?.user.email,
            address: profileQuery.data?.user.profile?.address,
          }}
        />
      )}
    </div>
  );
}
