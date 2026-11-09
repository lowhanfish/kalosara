"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Inbox,
  ArrowLeft,
  Mail,
  Phone,
  Building,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Eye,
  MessageSquare,
  FileText,
  Save,
} from "lucide-react";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsMutate, cmsError, type List } from "@/features/cms/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminLoading, AdminError, AdminEmptyState } from "@/components/admin/feedback";
import { AdminPagination } from "@/components/admin/pagination";
import { requestLabels, type CitizenRequest } from "@/lib/community";

function statusBadge(status: CitizenRequest["status"]) {
  switch (status) {
    case "NEW":
      return {
        label: "Pesan Baru",
        badge: "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-500",
      };
    case "IN_PROGRESS":
      return {
        label: "Sedang Diproses",
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
      };
    case "RESOLVED":
      return {
        label: "Selesai",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
      };
    case "ARCHIVED":
      return {
        label: "Arsip",
        badge: "bg-slate-100 text-slate-600 border-slate-200",
        dot: "bg-slate-400",
      };
    default:
      return {
        label: status,
        badge: "bg-slate-100 text-slate-600 border-slate-200",
        dot: "bg-slate-400",
      };
  }
}

function RequestDetail({
  item,
  onClose,
  onSaved,
}: {
  item: CitizenRequest;
  onClose: () => void;
  onSaved: () => void;
}) {
  const runtime = useAuthRuntime();
  const [status, setStatus] = useState(item.status);
  const [note, setNote] = useState(item.internalNote);
  const [version, setVersion] = useState(item.version);
  const [notice, setNotice] = useState("");
  const badgeInfo = statusBadge(status);

  const save = useMutation({
    mutationFn: () =>
      cmsMutate<{ version: number }>(
        runtime.request,
        `/admin/community/requests/${item.id}`,
        { status, internalNote: note, expectedVersion: version },
        "PATCH",
      ),
    onSuccess: (r) => {
      setVersion(r.version);
      setNotice("Status tindak lanjut dan catatan berhasil disimpan.");
      onSaved();
    },
  });

  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Makassar",
  }).format(new Date(item.createdAt));

  return (
    <div className="space-y-6">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Daftar Pesan</span>
        </button>

        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${badgeInfo.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${badgeInfo.dot}`} />
          {badgeInfo.label}
        </span>
      </div>

      <section className="space-y-6 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="border-b border-slate-100 pb-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
              {item.kind === "COMPLAINT" ? "Pengaduan Masyarakat" : "Permohonan Informasi PPID"}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock size={12} />
              {formattedDate}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">{item.subject}</h2>
        </div>

        {/* Sender details card */}
        <div className="grid gap-4 sm:grid-cols-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white border border-slate-200/80 text-slate-500 shadow-2xs">
              <User size={16} />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Nama Pengirim
              </span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{item.name}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white border border-slate-200/80 text-slate-500 shadow-2xs">
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
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white border border-slate-200/80 text-slate-500 shadow-2xs">
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
                    className="text-primary hover:underline break-all"
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
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white border border-slate-200/80 text-slate-500 shadow-2xs">
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
                    className="text-primary hover:underline"
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

        {/* Message body */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Isi Pesan Masyarakat
          </label>
          <div className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-800 shadow-2xs">
            {item.message}
          </div>
        </div>

        {/* Form Follow-up */}
        <form
          className="space-y-4 pt-4 border-t border-slate-100"
          onSubmit={(e) => {
            e.preventDefault();
            setNotice("");
            save.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Status Tindak Lanjut
              </label>
              <select
                className="cms-input"
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Catatan Internal Petugas Kelurahan
            </label>
            <textarea
              className="cms-input"
              value={note}
              maxLength={5000}
              rows={4}
              placeholder="Catatan progres tindak lanjut oleh petugas, solusi yang diberikan, atau nomor disposisi..."
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="text-[11px] text-slate-400">
              Catatan ini bersifat internal dan hanya dapat dibaca oleh staf/admin kelurahan.
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
            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {save.isPending ? (
                <>
                  <RotateCw size={14} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Simpan Tindak Lanjut</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function InboxWorkspace() {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const [page, setPage] = useState(1);
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState("");

  const query = useQuery({
    queryKey: ["user", auth.user?.id, "community-inbox", page, kind, status],
    enabled: auth.user?.role === "ADMIN_KELURAHAN",
    queryFn: () =>
      runtime.request<List<CitizenRequest>>(
        `/admin/community/requests?${new URLSearchParams({
          page: String(page),
          ...(kind ? { kind } : {}),
          ...(status ? { status } : {}),
        })}`,
      ),
  });

  const detail = useQuery({
    queryKey: ["user", auth.user?.id, "community-request", selected],
    enabled: !!selected && auth.user?.role === "ADMIN_KELURAHAN",
    queryFn: () =>
      runtime.request<{ item: CitizenRequest }>(
        `/admin/community/requests/${selected}`,
      ),
  });

  return (
    <main id="konten" className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Kotak Masuk Masyarakat"
        description="Kelola pengaduan warga dan permohonan informasi publik (PPID). Identitas dan nomor kontak terjaga aman."
        icon={Inbox}
      />

      {auth.user?.role !== "ADMIN_KELURAHAN" ? (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <AlertCircle size={16} className="text-amber-600" />
          <span>Halaman ini khusus untuk administrator kelurahan.</span>
        </div>
      ) : selected ? (
        <>
          {detail.isPending && <AdminLoading />}
          {detail.isError && <AdminError error={detail.error} />}
          {detail.data && (
            <RequestDetail
              key={`${selected}-${detail.data.item.version}`}
              item={detail.data.item}
              onClose={() => setSelected("")}
              onSaved={() => void query.refetch()}
            />
          )}
        </>
      ) : (
        <>
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs text-slate-500">
                Jenis Pesan:
                <select
                  className="cms-input ml-2 text-xs py-1.5"
                  value={kind}
                  onChange={(e) => {
                    setKind(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Semua Jenis</option>
                  <option value="COMPLAINT">Pengaduan Masyarakat</option>
                  <option value="INFORMATION">Permohonan Informasi (PPID)</option>
                </select>
              </label>

              <label className="text-xs text-slate-500">
                Status:
                <select
                  className="cms-input ml-2 text-xs py-1.5"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Semua Status</option>
                  {Object.entries(requestLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={() => void query.refetch()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs self-start sm:self-auto"
            >
              <RotateCw size={13} className={query.isFetching ? "animate-spin text-primary" : ""} />
              <span>Segarkan</span>
            </button>
          </div>

          {query.isPending && <AdminLoading />}
          {query.isError && <AdminError error={query.error} />}

          {query.data && (
            <div className="space-y-4">
              {query.data.items.length === 0 ? (
                <AdminEmptyState
                  title="Belum ada pesan masuk"
                  description="Saat ini belum ada pengaduan atau permohonan informasi yang sesuai dengan filter yang dipilih."
                />
              ) : (
                <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden divide-y divide-slate-100">
                  {query.data.items.map((item) => {
                    const badgeInfo = statusBadge(item.status);
                    const formattedDate = new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Makassar",
                    }).format(new Date(item.createdAt));

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4 hover:bg-slate-50/60 transition-colors"
                      >
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                item.kind === "COMPLAINT"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {item.kind === "COMPLAINT"
                                ? "Pengaduan"
                                : "Permohonan PPID"}
                            </span>

                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badgeInfo.badge}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${badgeInfo.dot}`}
                              />
                              {badgeInfo.label}
                            </span>

                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs text-slate-500">
                              {formattedDate}
                            </span>
                          </div>

                          <h3 className="font-bold text-slate-900 text-sm truncate">
                            {item.subject}
                          </h3>

                          <p className="text-xs text-slate-500">
                            Pengirim:{" "}
                            <strong className="text-slate-700">{item.name}</strong>
                            {item.organization ? ` (${item.organization})` : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setSelected(item.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
                          >
                            <Eye size={14} className="text-primary" />
                            <span>Buka Pesan</span>
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
                itemName="pesan"
              />
            </div>
          )}
        </>
      )}
    </main>
  );
}
