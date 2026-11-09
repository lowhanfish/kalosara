"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  UserCheck,
  ArrowLeft,
  Search,
  RotateCw,
  Mail,
  Phone,
  Clock,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import { AdminLoading, AdminError, AdminEmptyState } from "@/components/admin/feedback";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/pagination";
import { AdminAccess } from "@/features/cms/admin-access";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsError, type List } from "@/features/cms/client";
import { accountMutation, type ContactChange } from "@/features/account/client";

type Pending = ContactChange & {
  userId: string;
  user: { email: string; phone: string | null };
};

function ReviewFormModal({
  item,
  onClose,
}: {
  item: Pending;
  onClose: () => void;
}) {
  const runtime = useAuthRuntime();
  const isExpired = new Date(item.expiresAt) <= new Date();
  const [approve, setApprove] = useState(!isExpired);

  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      accountMutation(
        runtime.request,
        `/admin/contact-changes/${item.id}/review`,
        body,
      ),
    onSuccess: async () => {
      await runtime.queryClient.invalidateQueries({ queryKey: ["user"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <span>Verifikasi Perubahan Kontak</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Akun: <span className="font-semibold text-slate-800">{item.user.email}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Change Comparison */}
        <div className="grid gap-3 sm:grid-cols-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 text-xs">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Email Pengajuan
            </span>
            <p className="font-bold text-slate-900 mt-1 break-all">
              {item.newEmail ?? "Tidak berubah (Tetap)"}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Nomor Telepon Pengajuan
            </span>
            <p className="font-bold text-slate-900 mt-1">
              {item.newPhone ?? "Tidak berubah (Tetap)"}
            </p>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (
              !confirm(
                approve
                  ? "Setujui perubahan kontak setelah verifikasi identitas? Semua sesi login aktif pemilik akun akan dicabut."
                  : "Tolak dan batalkan permintaan perubahan kontak ini?",
              )
            )
              return;
            const form = e.currentTarget;
            const f = new FormData(form);
            const body = {
              decision: approve ? "APPROVE" : "REJECT",
              currentPassword: String(f.get("password")),
              identityVerified: f.get("identity") === "on",
              contactOwnershipVerified: f.get("ownership") === "on",
            };
            form.reset();
            mutation.mutate(body);
          }}
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Keputusan Verifikasi
            </label>
            <select
              className="cms-input"
              value={approve ? "APPROVE" : "REJECT"}
              onChange={(e) => setApprove(e.target.value === "APPROVE")}
            >
              <option value="APPROVE" disabled={isExpired}>
                Setujui Perubahan Kontak {isExpired ? "(Telah Kedaluwarsa)" : ""}
              </option>
              <option value="REJECT">Tolak Permintaan</option>
            </select>
            {isExpired && (
              <p className="text-[11px] text-amber-600 font-medium">
                Permintaan ini telah melampaui batas waktu verifikasi dan hanya dapat ditolak.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Kata Sandi Administrator Anda
            </label>
            <input
              name="password"
              className="cms-input"
              type="password"
              required
              maxLength={72}
              placeholder="Masukkan kata sandi admin Anda untuk otorisasi..."
              autoComplete="current-password"
            />
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 cursor-pointer">
              <input type="checkbox" name="identity" required className="mt-0.5 rounded border-slate-300 text-primary focus:ring-primary" />
              <span>
                Saya telah memverifikasi identitas pemilik akun secara sah melalui prosedur pelayanan kantor.
              </span>
            </label>

            <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                name="ownership"
                required={approve}
                disabled={!approve}
                className="mt-0.5 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span>
                Kepemilikan kontak email/nomor telepon baru telah dipastikan benar milik pemohon.
              </span>
            </label>
          </div>

          {mutation.isError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle size={15} className="shrink-0 text-red-600" />
              <span>{cmsError(mutation.error)}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? (
                <>
                  <RotateCw size={13} className="animate-spin" />
                  <span>Menyimpan Keputusan...</span>
                </>
              ) : (
                <>
                  <FileCheck2 size={14} />
                  <span>Simpan Keputusan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Reviews() {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Pending | null>(null);

  const query = useQuery({
    queryKey: ["user", auth.user?.id, "contact-reviews", page, search],
    queryFn: () =>
      runtime.request<List<Pending>>(
        `/admin/contact-changes?page=${page}&search=${encodeURIComponent(search)}`,
      ),
  });

  return (
    <div className="space-y-6">
      {/* Return to Users Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <Link
          href="/admin/pengguna"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Manajemen Pengguna</span>
        </Link>

        <span className="text-xs text-slate-500">
          Kontak lama tetap berlaku sampai proses verifikasi selesai.
        </span>
      </div>

      {/* Search and Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="cms-input pl-10 pr-9 text-xs"
            placeholder="Cari permohonan berdasarkan email akun..."
            value={search}
            maxLength={100}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 grid size-6 place-items-center rounded-md text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => void query.refetch()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RotateCw size={13} className={query.isFetching ? "animate-spin text-primary" : ""} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Review Modal */}
      {selected && (
        <ReviewFormModal
          key={selected.id}
          item={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Status Views */}
      {query.isPending && <AdminLoading />}
      {query.isError && (
        <AdminError error={query.error} onRetry={() => void query.refetch()} />
      )}

      {query.data && (
        <div className="space-y-4">
          {query.data.items.length === 0 ? (
            <AdminEmptyState
              title="Tidak ada permohonan verifikasi"
              description="Saat ini belum ada pengajuan perubahan email atau nomor telepon dari warga yang perlu ditinjau."
            />
          ) : (
            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden divide-y divide-slate-100">
              {query.data.items.map((item) => {
                const isExpired = new Date(item.expiresAt) <= new Date();
                const formattedDate = new Date(item.expiresAt).toLocaleString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">
                          {item.user.email}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isExpired
                              ? "bg-slate-100 text-slate-600 border border-slate-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isExpired ? "bg-slate-400" : "bg-amber-500"
                            }`}
                          />
                          {isExpired ? "Kedaluwarsa" : "Menunggu Verifikasi"}
                        </span>
                      </div>

                      <div className="grid gap-1.5 sm:grid-cols-2 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Mail size={13} className="text-slate-400 shrink-0" />
                          <span>
                            Email baru:{" "}
                            <strong className="text-slate-800">
                              {item.newEmail ?? "Tetap"}
                            </strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone size={13} className="text-slate-400 shrink-0" />
                          <span>
                            Nomor baru:{" "}
                            <strong className="text-slate-800">
                              {item.newPhone ?? "Tetap"}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>Batas waktu verifikasi: {formattedDate}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setSelected(item)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <UserCheck size={14} className="text-primary" />
                        <span>Tinjau Permintaan</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <AdminPagination
            page={page}
            total={query.data.total}
            limit={10}
            onPageChange={setPage}
            itemName="permintaan"
          />
        </div>
      )}
    </div>
  );
}

export default function ContactReviewPage() {
  return (
    <main className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Verifikasi Perubahan Kontak"
        description="Tinjau dan verifikasi pengajuan perubahan alamat email atau nomor telepon dari warga terdaftar."
        icon={UserCheck}
      />
      <AdminAccess>
        <Reviews />
      </AdminAccess>
    </main>
  );
}
