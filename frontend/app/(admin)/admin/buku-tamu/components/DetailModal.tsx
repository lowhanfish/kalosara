"use client";

import { useState } from "react";
import {
  X,
  User,
  Phone,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  IdCard,
} from "lucide-react";
import type { GuestBookItem } from "../types";
import { useUpdateGuestBookStatus } from "../hooks/crud";

export function DetailModal({
  item,
  onClose,
  canEdit = true,
}: {
  item: GuestBookItem | null;
  onClose: () => void;
  canEdit?: boolean;
}) {
  const [internalNote, setInternalNote] = useState(item?.internalNote || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const updateMutation = useUpdateGuestBookStatus(() => {
    setIsUpdating(false);
    onClose();
  });

  if (!item) return null;

  const handleMarkServed = async () => {
    setIsUpdating(true);
    updateMutation.mutate({
      id: item.id,
      status: "SERVED",
      internalNote,
      servedBy: "Petugas Pelayanan",
    });
  };

  const dt = new Date(item.createdAt);
  const formattedTime = dt.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <span className="font-mono text-xs font-bold text-primary">
              #{item.ticketNumber}
            </span>
            <h3 className="text-base font-bold text-slate-800">
              Detail Kunjungan Tamu
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6 text-sm">
          {/* Status Badge */}
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <div>
              <span className="text-xs text-slate-500">Status Kunjungan</span>
              <div className="mt-0.5 font-bold">
                {item.status === "WAITING" && (
                  <span className="inline-flex items-center gap-1.5 text-amber-600">
                    <Clock className="size-4" />
                    Menunggu Pelayanan
                  </span>
                )}
                {item.status === "SERVED" && (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle2 className="size-4" />
                    Selesai Dilayani
                  </span>
                )}
                {item.status === "CANCELLED" && (
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    Dibatalkan
                  </span>
                )}
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              {formattedTime}
            </div>
          </div>

          {/* Profil Tamu */}
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <User className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500">Nama Lengkap</p>
                <p className="font-bold text-slate-900">{item.fullName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Phone className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500">No. WhatsApp / HP</p>
                <a
                  href={`tel:${item.phone}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {item.phone}
                </a>
              </div>
            </div>

            {item.nik && (
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <IdCard className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500">NIK</p>
                  <p className="font-mono font-medium text-slate-800">
                    {item.nik}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Building2 className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500">Kategori & Asal</p>
                <p className="font-semibold text-slate-800">
                  {item.institution ||
                    item.addressOrRt ||
                    `Warga (${item.guestType})`}
                </p>
              </div>
            </div>
          </div>

          {/* Keperluan */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500">Keperluan</p>
                <p className="font-bold text-slate-900">{item.purpose}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Tujuan:{" "}
                  <span className="font-semibold text-slate-700">
                    {item.destinationStaff}
                  </span>
                </p>
                {item.notes && (
                  <p className="mt-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600">
                    Catatan Tamu: &ldquo;{item.notes}&rdquo;
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Catatan Internal Staf */}
          {canEdit && (
            <div>
              <label
                htmlFor="internalNote"
                className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Catatan Petugas Pelayanan (Opsional)
              </label>
              <textarea
                id="internalNote"
                rows={2}
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Misal: Sudah diarahkan ke Kasi Pemerintahan atau berkas sudah diverifikasi."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 focus:border-primary focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 p-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Tutup
          </button>
          {canEdit && item.status === "WAITING" && (
            <button
              onClick={handleMarkServed}
              disabled={isUpdating}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="size-4" />
              <span>{isUpdating ? "Memproses..." : "Tandai Selesai Dilayani"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
