"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Clock,
  User,
  Building,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";
import { cmsError } from "@/features/cms/client";
import { requestLabels, type CitizenRequest } from "@/lib/community";
import { Badge, Button, Card } from "@/app/(admin)/_components/ui";
import { useUpdateMaster } from "../hooks/crud";

export function FormTindakLanjutModal({
  item,
  onClose,
  onSaved,
}: {
  item: CitizenRequest;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState(item.status);
  const [note, setNote] = useState(item.internalNote);
  const [version, setVersion] = useState(item.version);
  const [notice, setNotice] = useState("");

  const save = useUpdateMaster(item.id, (nextVersion) => {
    setVersion(nextVersion);
    setNotice("Status tindak lanjut dan catatan berhasil disimpan.");
    onSaved();
  });

  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Makassar",
  }).format(new Date(item.createdAt));

  return (
    <div className="space-y-6">
      <div className="glass-toolbar flex items-center justify-between p-4">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-sky-600 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Daftar Pesan</span>
        </button>

        <Badge
          variant={
            status === "RESOLVED"
              ? "success"
              : status === "IN_PROGRESS"
                ? "warning"
                : status === "NEW"
                  ? "sky"
                  : "neutral"
          }
          dot
        >
          {requestLabels[status] ?? status}
        </Badge>
      </div>

      <Card padding="lg" className="space-y-6">
        <div className="border-b border-sky-100/70 pb-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="sky">
              {item.kind === "COMPLAINT"
                ? "Pengaduan Masyarakat"
                : "Permohonan Informasi PPID"}
            </Badge>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock size={12} />
              {formattedDate}
            </span>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900">
            {item.subject}
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 rounded-2xl border border-sky-200/70 bg-white/75 p-5 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="glass-icon-box size-9 rounded-xl">
              <User size={16} />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Nama Pengirim
              </span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {item.name}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="glass-icon-box size-9 rounded-xl">
              <Building size={16} />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Instansi / Lembaga
              </span>
              <p className="font-semibold text-slate-800 text-sm mt-0.5">
                {item.organization || "Pribadi / Perorangan"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="glass-icon-box size-9 rounded-xl">
              <Mail size={16} />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Alamat Email
              </span>
              <p className="font-semibold text-slate-800 text-sm mt-0.5">
                {item.email ? (
                  <a
                    href={`mailto:${item.email}`}
                    className="text-sky-600 hover:underline break-all"
                  >
                    {item.email}
                  </a>
                ) : (
                  "—"
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="glass-icon-box size-9 rounded-xl">
              <Phone size={16} />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Nomor Telepon / WA
              </span>
              <p className="font-semibold text-slate-800 text-sm mt-0.5">
                {item.phone ? (
                  <a
                    href={`https://wa.me/${item.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 hover:underline"
                  >
                    {item.phone}
                  </a>
                ) : (
                  "—"
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Isi Pesan Masyarakat
          </label>
          <div className="whitespace-pre-wrap rounded-2xl border border-sky-200/70 bg-white/85 p-5 text-sm leading-relaxed text-slate-800 shadow-2xs">
            {item.message}
          </div>
        </div>

        <form
          className="space-y-4 pt-4 border-t border-sky-100/70"
          onSubmit={(e) => {
            e.preventDefault();
            setNotice("");
            save.mutate({
              status,
              internalNote: note,
              expectedVersion: version,
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Status Tindak Lanjut
              </label>
              <select
                className="cms-input w-full"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as CitizenRequest["status"])
                }
              >
                {Object.entries(requestLabels).map(([key, label]) => (
                  <option value={key} key={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Catatan Internal Petugas Kelurahan
            </label>
            <textarea
              className="cms-input w-full"
              value={note}
              maxLength={5000}
              rows={4}
              placeholder="Catatan progres tindak lanjut oleh petugas, solusi yang diberikan, atau nomor disposisi..."
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="text-[11px] text-slate-400">
              Catatan ini bersifat internal dan hanya dapat dibaca oleh
              staf/admin kelurahan.
            </p>
          </div>

          {notice && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>{notice}</span>
            </div>
          )}

          {save.isError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle size={15} className="shrink-0 text-red-600" />
              <span>{cmsError(save.error)}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={save.isPending}
              leftIcon={!save.isPending ? <Save size={14} /> : undefined}
            >
              {save.isPending ? "Menyimpan..." : "Simpan Tindak Lanjut"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
