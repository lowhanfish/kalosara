"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck,
  Search,
  RotateCw,
  Eye,
  Download,
  AlertCircle,
  Paperclip,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth-provider";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Pagination,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/app/(admin)/_components/ui";
import {
  AdminLoading,
  AdminError,
  AdminEmptyState,
} from "@/components/admin/feedback";
import { LETTER_DEFINITIONS } from "@/features/persuratan/letter-definitions";
import type { LetterRequest, LetterStatus, LetterType } from "@/features/persuratan/types";

export default function AdminPersuratanPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LetterStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<LetterType | "">("");

  // Modal Detail State
  const [selectedLetter, setSelectedLetter] = useState<LetterRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Fetch admin letters query
  const lettersQuery = useQuery({
    queryKey: ["admin", "letters", { page, search, statusFilter, typeFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "10");
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);

      const res = await fetch(`/api/v1/admin/letters?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data permohonan surat");
      const json = await res.json();
      return json.data as { items: LetterRequest[]; total: number; totalPages: number };
    },
  });

  // Action mutation (verify, reject, sign)
  const actionMutation = useMutation({
    mutationFn: async ({
      id,
      action,
      reason,
    }: {
      id: string;
      action: "VERIFY" | "REJECT" | "SIGN";
      reason?: string;
    }) => {
      const csrfRes = await fetch("/api/v1/auth/csrf");
      const csrfJson = await csrfRes.json();
      const csrfToken = csrfJson.data?.csrfToken;

      const res = await fetch(`/api/v1/admin/letters/${id}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken ?? "",
        },
        body: JSON.stringify({ action, reason }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Gagal memproses surat");
      }
      return json.data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "letters"] });
      setSelectedLetter(updated);
      setShowRejectForm(false);
      setRejectionReason("");
    },
  });

  const items = lettersQuery.data?.items ?? [];
  const totalPages = lettersQuery.data?.totalPages ?? 1;

  const handleAction = async (action: "VERIFY" | "REJECT" | "SIGN") => {
    if (!selectedLetter) return;
    if (action === "REJECT" && !rejectionReason.trim()) {
      alert("Alasan penolakan wajib diisi");
      return;
    }
    await actionMutation.mutateAsync({
      id: selectedLetter.id,
      action,
      reason: action === "REJECT" ? rejectionReason : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pelayanan Persuratan (KALOSARA)"
        description={`Kanal Layanan Online Surat dan Administrasi Rakyat — ${
          auth.user?.role === "LURAH"
            ? "Otoritas Tanda Tangan Elektronik (TTE) Lurah Watundehoa."
            : "Verifikasi berkas permohonan warga dan koordinasi TTE Lurah."
        }`}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={auth.user?.role === "LURAH" ? "sky" : "neutral"}>
              {auth.user?.role === "LURAH"
                ? "Pejabat Penandatangan (Lurah)"
                : "Admin Kelurahan (Verifikator)"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => lettersQuery.refetch()}
              disabled={lettersQuery.isFetching}
            >
              <RotateCw
                size={16}
                className={lettersQuery.isFetching ? "animate-spin" : ""}
              />
              <span>Refresh</span>
            </Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
            {[
              { id: "", label: "Semua Status" },
              { id: "SUBMITTED", label: "Menunggu Verifikasi" },
              { id: "VERIFIED", label: "Menunggu TTE Lurah" },
              { id: "SIGNED", label: "Selesai (Ditandatangani)" },
              { id: "REJECTED", label: "Ditolak / Revisi" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id as LetterStatus | "");
                  setPage(1);
                }}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  statusFilter === tab.id
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Letter Type dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Cari berdasarkan No Tiket, Nama Pemohon, atau NIK..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs text-slate-800 transition focus:border-sky-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as LetterType | "");
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 transition focus:border-sky-500 focus:bg-white focus:outline-none"
              >
                <option value="">Semua Jenis Surat (10 Layanan)</option>
                {Object.values(LETTER_DEFINITIONS).map((def) => (
                  <option key={def.code} value={def.code}>
                    {def.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card>
        {lettersQuery.isLoading ? (
          <AdminLoading />
        ) : lettersQuery.isError ? (
          <AdminError
            error={lettersQuery.error}
            onRetry={() => lettersQuery.refetch()}
          />
        ) : items.length === 0 ? (
          <AdminEmptyState
            title="Tidak Ada Permohonan Surat"
            description="Belum ada data permohonan surat yang cocok dengan kriteria pencarian atau filter yang dipilih."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Tiket / Register</TableHead>
                  <TableHead>Pemohon (Nama & NIK)</TableHead>
                  <TableHead>Jenis Surat</TableHead>
                  <TableHead>Tanggal Pengajuan</TableHead>
                  <TableHead>Lampiran</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const meta = LETTER_DEFINITIONS[item.type];
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-mono text-xs font-bold text-sky-800">
                          {item.ticketNumber}
                        </div>
                        {item.letterNumber && (
                          <div className="font-mono text-[11px] text-slate-500">
                            {item.letterNumber}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="font-bold text-xs text-slate-900">
                          {item.applicantName}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500">
                          NIK: {item.applicantNik}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-semibold text-slate-800">
                          {meta?.shortTitle ?? item.title}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                          {item.type}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs text-slate-600">
                          {new Date(item.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(item.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          WITA
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                          <Paperclip size={12} />
                          {item.attachments?.length ?? 0} berkas
                        </span>
                      </TableCell>

                      <TableCell>
                        {item.status === "SUBMITTED" && (
                          <Badge variant="warning">Menunggu Verifikasi</Badge>
                        )}
                        {item.status === "VERIFIED" && (
                          <Badge variant="info">Menunggu TTE Lurah</Badge>
                        )}
                        {item.status === "SIGNED" && (
                          <Badge variant="success">Ditandatangani</Badge>
                        )}
                        {item.status === "REJECTED" && (
                          <Badge variant="danger">Ditolak</Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLetter(item);
                            setShowRejectForm(false);
                            setRejectionReason("");
                          }}
                        >
                          <Eye size={14} />
                          <span>Periksa</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Total <strong>{lettersQuery.data?.total ?? 0}</strong> permohonan surat
              </p>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={lettersQuery.data?.total ?? 0}
                pageSize={10}
                onPageChange={setPage}
                itemName="permohonan surat"
              />
            </div>
          </>
        )}
      </Card>

      {/* Detail & Action Modal */}
      {selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl my-8 overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
              <div>
                <span className="font-mono text-xs text-sky-400">
                  {selectedLetter.ticketNumber}
                </span>
                <h3 className="text-base font-extrabold uppercase tracking-wide">
                  {LETTER_DEFINITIONS[selectedLetter.type]?.title ?? selectedLetter.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLetter(null)}
                className="grid size-8 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 border border-slate-200/80">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Status Dokumen:
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    {selectedLetter.status === "SUBMITTED" && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                        <Clock size={12} /> Menunggu Verifikasi Berkas Admin
                      </span>
                    )}
                    {selectedLetter.status === "VERIFIED" && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 bg-sky-100 px-2.5 py-1 rounded-full">
                        <FileCheck size={12} /> Terverifikasi, Menunggu TTE Lurah
                      </span>
                    )}
                    {selectedLetter.status === "SIGNED" && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        <CheckCircle2 size={12} /> Selesai & Ditandatangani Elektronik
                      </span>
                    )}
                    {selectedLetter.status === "REJECTED" && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                        <XCircle size={12} /> Ditolak / Perlu Perbaikan
                      </span>
                    )}
                  </div>
                </div>

                {selectedLetter.status === "SIGNED" && selectedLetter.pdfUrl && (
                  <div className="flex items-center gap-2">
                    <a
                      href={selectedLetter.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                    >
                      <Download size={14} />
                      <span>Unduh PDF Resmi</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Rejection Note if Rejected */}
              {selectedLetter.status === "REJECTED" && selectedLetter.rejectionReason && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-xs">
                  <p className="font-bold uppercase tracking-wider">Alasan Penolakan:</p>
                  <p className="mt-1 leading-relaxed text-rose-900">{selectedLetter.rejectionReason}</p>
                </div>
              )}

              {/* Data Pemohon */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1">
                  Identitas Pemohon
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Nama Lengkap:</span>
                    <p className="font-bold text-slate-800">{selectedLetter.applicantName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">NIK:</span>
                    <p className="font-mono font-bold text-slate-800">{selectedLetter.applicantNik}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Tempat, Tgl Lahir:</span>
                    <p className="text-slate-800">
                      {selectedLetter.birthPlace}, {selectedLetter.birthDate}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Agama / JK:</span>
                    <p className="text-slate-800">
                      {selectedLetter.religion} / {selectedLetter.gender}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Status Perkawinan:</span>
                    <p className="text-slate-800">{selectedLetter.maritalStatus}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Pekerjaan:</span>
                    <p className="text-slate-800">{selectedLetter.occupation}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400">Alamat Lengkap:</span>
                    <p className="text-slate-800">{selectedLetter.address}</p>
                  </div>
                </div>
              </div>

              {/* Isian Spesifik Surat */}
              {selectedLetter.details && Object.keys(selectedLetter.details).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1">
                    Detail Khusus Surat
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl">
                    {Object.entries(selectedLetter.details).map(([key, val]) => (
                      <div key={key}>
                        <span className="text-slate-400 capitalize">{key}:</span>
                        <p className="font-semibold text-slate-800">{String(val)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Berkas Lampiran */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1">
                  Berkas Lampiran ({selectedLetter.attachments?.length ?? 0})
                </h4>
                {selectedLetter.attachments && selectedLetter.attachments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedLetter.attachments.map((file, idx) => (
                      <a
                        key={file.id || idx}
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 hover:border-sky-300 hover:bg-sky-50 transition group"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-700">
                            <FileText size={16} />
                          </span>
                          <span className="truncate text-xs font-semibold text-slate-800 group-hover:text-sky-950">
                            {file.name}
                          </span>
                        </div>
                        <ExternalLink size={14} className="text-slate-400 group-hover:text-sky-600 shrink-0" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Tidak ada berkas lampiran yang diunggah.</p>
                )}
              </div>

              {/* Form Input Alasan Penolakan */}
              {showRejectForm && (
                <div className="rounded-xl border border-rose-300 bg-rose-50/70 p-4 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
                    <AlertCircle size={16} />
                    <span>Tuliskan Alasan Penolakan / Petunjuk Perbaikan:</span>
                  </div>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Contoh: Foto KTP buram dan surat pengantar RT belum dilampirkan. Silakan unggah kembali berkas yang jelas."
                    className="w-full rounded-xl border border-rose-200 bg-white p-3 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(false)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={actionMutation.isPending}
                      onClick={() => handleAction("REJECT")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition"
                    >
                      <X size={14} />
                      <span>Kirim Penolakan ke Warga</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLetter(null)}
              >
                Tutup
              </Button>

              <div className="flex flex-wrap items-center gap-2">
                {/* When SUBMITTED: Admin can verify or reject */}
                {selectedLetter.status === "SUBMITTED" && !showRejectForm && (
                  <>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setShowRejectForm(true)}
                    >
                      <X size={14} />
                      <span>Tolak / Minta Perbaikan</span>
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={actionMutation.isPending}
                      onClick={() => handleAction("VERIFY")}
                    >
                      <Check size={14} />
                      <span>Loloskan ke Meja Lurah</span>
                    </Button>
                  </>
                )}

                {/* When VERIFIED: Only Lurah can sign (TTE). Admin Kelurahan cannot sign. */}
                {selectedLetter.status === "VERIFIED" && (
                  auth.user?.role === "LURAH" ? (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={actionMutation.isPending}
                      onClick={() => handleAction("SIGN")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <ShieldCheck size={16} />
                      <span>Tandatangani Surat (TTE) &amp; Terbitkan</span>
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2 text-xs font-medium text-amber-900">
                      <Clock size={15} className="text-amber-600 shrink-0" />
                      <span>
                        Berkas telah diverifikasi. Menunggu penandatanganan elektronik (TTE) oleh <strong>Bapak/Ibu Lurah</strong>.
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
