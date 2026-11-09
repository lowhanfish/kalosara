"use client";

import React, { useState } from "react";
import { UserCheck, X, AlertCircle, RotateCw, FileCheck2 } from "lucide-react";
import { cmsError } from "@/features/cms/client";
import { useUpdateMaster } from "../hooks/crud";
import type { PendingContactChange } from "../types";

export function FormReviewKontakModal({
  item,
  onClose,
}: {
  item: PendingContactChange;
  onClose: () => void;
}) {
  const isExpired = new Date(item.expiresAt) <= new Date();
  const [approve, setApprove] = useState(!isExpired);
  const mutation = useUpdateMaster(item.id, onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="flex items-start justify-between border-b border-sky-100/70 pb-4">
          <div className="flex items-center gap-3">
            <div className="glass-icon-box size-10 rounded-xl">
              <UserCheck size={20} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Verifikasi Perubahan Kontak
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Akun:{" "}
                <span className="font-bold text-slate-800">
                  {item.user.email}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 rounded-2xl border border-sky-200/70 bg-white/80 p-4 text-xs shadow-2xs">
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
              className="cms-input w-full"
              value={approve ? "APPROVE" : "REJECT"}
              onChange={(e) => setApprove(e.target.value === "APPROVE")}
            >
              <option value="APPROVE" disabled={isExpired}>
                Setujui Perubahan Kontak{" "}
                {isExpired ? "(Telah Kedaluwarsa)" : ""}
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
              className="cms-input w-full"
              type="password"
              required
              maxLength={72}
              placeholder="Masukkan kata sandi admin Anda untuk otorisasi..."
              autoComplete="current-password"
            />
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-start gap-2.5 rounded-xl border border-sky-200/70 bg-white/80 p-3 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                name="identity"
                required
                className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-600"
              />
              <span>
                Saya telah memverifikasi identitas pemilik akun secara sah melalui prosedur pelayanan kantor.
              </span>
            </label>

            <label className="flex items-start gap-2.5 rounded-xl border border-sky-200/70 bg-white/80 p-3 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                name="ownership"
                required={approve}
                disabled={!approve}
                className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-600"
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

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-sky-100/70">
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={onClose}
              className="glass-button-secondary px-4 py-2.5 text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="glass-button-primary px-5 py-2.5 text-xs disabled:opacity-50"
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
