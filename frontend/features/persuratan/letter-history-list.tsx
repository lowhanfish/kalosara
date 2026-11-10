import React, { useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  QrCode,
  FileCheck,
  Paperclip,
  ExternalLink,
  Trash2,
  X,
} from "lucide-react";
import type { LetterRequest } from "./types";
import { LETTER_DEFINITIONS } from "./letter-definitions";

interface LetterHistoryListProps {
  letters: LetterRequest[];
  isLoading: boolean;
  onOpenReapply?: (letter: LetterRequest) => void;
  onDeleteLetter?: (letterId: string) => Promise<void>;
}

export function LetterHistoryList({
  letters,
  isLoading,
  onOpenReapply,
  onDeleteLetter,
}: LetterHistoryListProps) {
  const [letterToDelete, setLetterToDelete] = useState<LetterRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!letterToDelete || !onDeleteLetter) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await onDeleteLetter(letterToDelete.id);
      setLetterToDelete(null);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus permohonan surat");
    } finally {
      setIsDeleting(false);
    }
  };
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-xs">
        <div className="mx-auto size-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
        <p className="mt-3 text-xs font-semibold animate-pulse">Memuat riwayat permohonan surat...</p>
      </div>
    );
  }

  if (letters.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 shadow-xs">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-sky-50 text-sky-600">
          <FileText size={28} />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-800">
          Belum Ada Riwayat Permohonan
        </h3>
        <p className="mt-1 max-w-sm mx-auto text-xs text-slate-500">
          Anda belum pernah mengajukan surat digital. Silakan pilih jenis surat pada tab &ldquo;Ajukan Surat Baru&rdquo; di atas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {letters.map((letter) => {
        const meta = LETTER_DEFINITIONS[letter.type];
        const statusConfig = {
          SUBMITTED: {
            label: "Menunggu Verifikasi Admin",
            bg: "bg-amber-50 border-amber-200 text-amber-800",
            icon: Clock,
            stepIndex: 1,
          },
          REJECTED: {
            label: "Perlu Perbaikan / Ditolak",
            bg: "bg-rose-50 border-rose-200 text-rose-800",
            icon: XCircle,
            stepIndex: 1,
          },
          VERIFIED: {
            label: "Diteruskan ke Lurah (Menunggu TTE)",
            bg: "bg-sky-50 border-sky-200 text-sky-800",
            icon: FileCheck,
            stepIndex: 2,
          },
          SIGNED: {
            label: "Selesai & Ditandatangani",
            bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
            icon: CheckCircle2,
            stepIndex: 3,
          },
        }[letter.status];

        const StatusIcon = statusConfig.icon;

        return (
          <div
            key={letter.id}
            className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-slate-300 hover:shadow-md sm:p-6"
          >
            {/* Header info */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-md">
                    {letter.ticketNumber}
                  </span>
                  {letter.letterNumber && (
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      No: {letter.letterNumber}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusConfig.bg}`}
                  >
                    <StatusIcon size={12} />
                    {statusConfig.label}
                  </span>
                </div>

                <h3 className="mt-2 text-base font-extrabold text-slate-900 sm:text-lg">
                  {meta?.title ?? letter.title}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Diajukan pada{" "}
                  {new Date(letter.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  WITA
                </p>
              </div>

              {/* Action Buttons if Signed */}
              {letter.status === "SIGNED" && letter.pdfUrl && (
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={letter.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:from-emerald-500 hover:to-teal-600 active:scale-95"
                  >
                    <Download size={14} />
                    <span>Unduh PDF Resmi</span>
                  </a>
                  {letter.qrCodeUrl && (
                    <a
                      href={letter.qrCodeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                      title="Periksa Keaslian Dokumen"
                    >
                      <QrCode size={14} />
                      <span>Cek QR TTE</span>
                    </a>
                  )}
                </div>
              )}

              {/* Action Button for Non-Signed (Can be cancelled & deleted) */}
              {letter.status !== "SIGNED" && onDeleteLetter && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null);
                      setLetterToDelete(letter);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 active:scale-95"
                    title="Batalkan & Hapus Permohonan"
                  >
                    <Trash2 size={13} className="text-rose-600" />
                    <span>{letter.status === "SUBMITTED" ? "Batalkan & Hapus" : "Hapus Riwayat"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Visual Stepper */}
            <div className="my-5">
              <div className="relative flex items-center justify-between">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-0" />
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-sky-500 transition-all duration-500 -z-0"
                  style={{
                    width:
                      letter.status === "SIGNED"
                        ? "100%"
                        : letter.status === "VERIFIED"
                        ? "66%"
                        : "33%",
                  }}
                />

                {/* Step 1: Diajukan */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="grid size-7 place-items-center rounded-full bg-sky-600 text-white text-xs font-bold shadow-sm">
                    ✓
                  </div>
                  <span className="mt-1.5 text-[11px] font-bold text-slate-700 text-center">
                    Diajukan
                  </span>
                </div>

                {/* Step 2: Verifikasi Admin */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`grid size-7 place-items-center rounded-full text-xs font-bold shadow-sm ${
                      letter.status === "REJECTED"
                        ? "bg-rose-600 text-white"
                        : statusConfig.stepIndex >= 2
                        ? "bg-sky-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {letter.status === "REJECTED" ? "✕" : statusConfig.stepIndex >= 2 ? "✓" : "2"}
                  </div>
                  <span className="mt-1.5 text-[11px] font-bold text-slate-700 text-center">
                    Verifikasi Admin
                  </span>
                </div>

                {/* Step 3: TTE Lurah */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`grid size-7 place-items-center rounded-full text-xs font-bold shadow-sm ${
                      letter.status === "SIGNED"
                        ? "bg-sky-600 text-white"
                        : statusConfig.stepIndex === 2
                        ? "bg-sky-100 text-sky-700 border-2 border-sky-600"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {letter.status === "SIGNED" ? "✓" : "3"}
                  </div>
                  <span className="mt-1.5 text-[11px] font-bold text-slate-700 text-center">
                    TTE Lurah
                  </span>
                </div>

                {/* Step 4: Selesai */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`grid size-7 place-items-center rounded-full text-xs font-bold shadow-sm ${
                      letter.status === "SIGNED"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {letter.status === "SIGNED" ? "✓" : "4"}
                  </div>
                  <span className="mt-1.5 text-[11px] font-bold text-slate-700 text-center">
                    Selesai
                  </span>
                </div>
              </div>
            </div>

            {/* Rejection Alert Box */}
            {letter.status === "REJECTED" && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/70 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-rose-800">
                      Alasan Penolakan / Catatan Perbaikan:
                    </p>
                    <p className="mt-1 text-sm text-rose-900 leading-relaxed">
                      {letter.rejectionReason || "Berkas lampiran belum lengkap atau tidak terbaca."}
                    </p>
                    {onOpenReapply && (
                      <button
                        type="button"
                        onClick={() => onOpenReapply(letter)}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-rose-700 active:scale-95"
                      >
                        Perbaiki & Unggah Ulang Berkas
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Details preview */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl">
              <div>
                <span className="font-semibold text-slate-500">Nama Pemohon:</span>{" "}
                <span className="font-bold text-slate-800">{letter.applicantName}</span> (NIK: {letter.applicantNik})
              </div>
              <div>
                <span className="font-semibold text-slate-500">Alamat:</span>{" "}
                <span className="text-slate-800">{letter.address}</span>
              </div>
              {letter.details && Object.entries(letter.details).map(([k, v]) => {
                if (typeof v === "object" || !v) return null;
                return (
                  <div key={k} className="truncate">
                    <span className="font-semibold text-slate-500 capitalize">{k}:</span>{" "}
                    <span className="text-slate-800">{String(v)}</span>
                  </div>
                );
              })}
            </div>

            {/* Attachments List */}
            {letter.attachments && letter.attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <Paperclip size={12} />
                  Lampiran ({letter.attachments.length}):
                </span>
                {letter.attachments.map((att, i) => (
                  <a
                    key={att.id || i}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-sky-700 hover:bg-sky-50 transition"
                  >
                    <span className="truncate max-w-[150px]">{att.name}</span>
                    <ExternalLink size={10} />
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Delete Confirmation Modal */}
      {letterToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-rose-100 text-rose-600">
                  <Trash2 size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {letterToDelete.status === "SUBMITTED"
                      ? "Batalkan & Hapus Permohonan?"
                      : "Hapus Riwayat Permohonan?"}
                  </h3>
                  <span className="font-mono text-xs text-slate-500">
                    {letterToDelete.ticketNumber}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLetterToDelete(null)}
                className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin membatalkan dan menghapus permohonan{" "}
              <strong>{LETTER_DEFINITIONS[letterToDelete.type]?.title ?? letterToDelete.title}</strong>?
              Data isian serta semua berkas lampiran yang telah diunggah akan dihapus secara permanen dari server.
            </p>

            {deleteError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                <AlertCircle size={14} className="shrink-0 text-rose-600" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setLetterToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="size-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Ya, Hapus Permohonan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
