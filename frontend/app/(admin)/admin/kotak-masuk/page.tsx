"use client";

import { useState } from "react";
import {
  AlertCircle,
  RotateCw,
  Eye,
  MessageSquare,
  FileText,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth-provider";
import {
  AdminLoading,
  AdminError,
  AdminEmptyState,
} from "@/components/admin/feedback";
import { InboxMailSvg } from "@/components/admin/admin-icons";
import { requestLabels, type CitizenRequest } from "@/lib/community";
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
import { listindex } from "@/utilities/pagination";
import {
  useResponseListMaster,
  useResponseDetailMaster,
} from "./hooks/crud";
import { FormTindakLanjutModal } from "./components/FormTindakLanjutModal";
import { DetailPesanModal } from "./components/DetailPesanModal";

export default function KotakMasukPage() {
  const auth = useAuth();
  const [page, setPage] = useState(1);
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState("");
  const [previewItem, setPreviewItem] = useState<CitizenRequest | null>(null);

  const query = useResponseListMaster({ page, kind, status });
  const detail = useResponseDetailMaster(selected);

  const items = query.data?.items ?? [];
  const totalItems = query.data?.total ?? 0;
  const newCount = items.filter((r) => r.status === "NEW").length;
  const inProgressCount = items.filter(
    (r) => r.status === "IN_PROGRESS",
  ).length;
  const resolvedCount = items.filter((r) => r.status === "RESOLVED").length;

  return (
    <main id="konten" className="min-w-0 space-y-6">
      <PageHeader
        title="Kotak Masuk Masyarakat"
        description="Kelola pengaduan warga dan permohonan informasi publik (PPID). Identitas dan nomor kontak terjaga aman."
        icon={InboxMailSvg}
        badge={{ text: "Pengaduan & PPID", variant: "sky" }}
      />

      {auth.user?.role !== "ADMIN_KELURAHAN" && auth.user?.role !== "LURAH" ? (
        <div className="glass-card flex items-center gap-2 p-5 text-xs font-semibold text-amber-800 border-amber-200/80 bg-amber-50/75">
          <AlertCircle size={16} className="text-amber-600" />
          <span>Halaman ini khusus untuk administrator kelurahan.</span>
        </div>
      ) : selected ? (
        <>
          {detail.isPending && <AdminLoading variant="detail" />}
          {detail.isError && <AdminError error={detail.error} />}
          {detail.data && (
            <FormTindakLanjutModal
              key={`${selected}-${detail.data.item.version}`}
              item={detail.data.item}
              onClose={() => setSelected("")}
              onSaved={() => void query.refetch()}
            />
          )}
        </>
      ) : (
        <>
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Card padding="sm" className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Pesan
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {totalItems}
                </span>
              </div>
              <div className="glass-icon-box size-10 rounded-xl">
                <InboxMailSvg size={19} />
              </div>
            </Card>

            <Card padding="sm" className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 block">
                  Pesan Baru
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {newCount}
                </span>
              </div>
              <Badge variant="sky" dot>
                Baru
              </Badge>
            </Card>

            <Card padding="sm" className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">
                  Sedang Diproses
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {inProgressCount}
                </span>
              </div>
              <Badge variant="warning" dot>
                Proses
              </Badge>
            </Card>

            <Card padding="sm" className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">
                  Selesai Ditangani
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {resolvedCount}
                </span>
              </div>
              <Badge variant="success" dot>
                Selesai
              </Badge>
            </Card>
          </div>

          {/* Filters Bar */}
          <div className="glass-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                className="cms-input text-xs font-semibold py-2 px-3 pr-8"
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua Jenis Pesan</option>
                <option value="COMPLAINT">Pengaduan Masyarakat</option>
                <option value="INFORMATION">Permohonan Informasi (PPID)</option>
              </select>

              <select
                className="cms-input text-xs font-semibold py-2 px-3 pr-8"
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
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => void query.refetch()}
              leftIcon={
                <RotateCw
                  size={13}
                  className={
                    query.isFetching ? "animate-spin text-sky-600" : ""
                  }
                />
              }
            >
              Segarkan
            </Button>
          </div>

          <DetailPesanModal
            isOpen={previewItem !== null}
            item={previewItem}
            onClose={() => setPreviewItem(null)}
            onOpenFull={(id) => setSelected(id)}
          />

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
                <Card padding="sm" className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center">No</TableHead>
                        <TableHead>Subjek & Pengirim</TableHead>
                        <TableHead>Jenis Pesan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Waktu Masuk</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {query.data.items.map((item, idx) => {
                        const formattedDate = new Intl.DateTimeFormat("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "Asia/Makassar",
                        }).format(new Date(item.createdAt));

                        return (
                          <TableRow key={item.id}>
                            <TableCell className="text-center font-bold text-slate-400 text-xs">
                              {listindex(10, page, idx)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-start gap-3">
                                <div
                                  className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                                    item.kind === "COMPLAINT"
                                      ? "bg-amber-50 text-amber-600 border border-amber-200/80"
                                      : "glass-icon-box"
                                  }`}
                                >
                                  {item.kind === "COMPLAINT" ? (
                                    <MessageSquare size={16} />
                                  ) : (
                                    <FileText size={16} />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-extrabold text-slate-900 text-sm line-clamp-1">
                                    {item.subject}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Pengirim:{" "}
                                    <strong className="text-slate-700">
                                      {item.name}
                                    </strong>
                                    {item.organization
                                      ? ` (${item.organization})`
                                      : ""}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.kind === "COMPLAINT" ? "warning" : "sky"
                                }
                              >
                                {item.kind === "COMPLAINT"
                                  ? "Pengaduan"
                                  : "Permohonan PPID"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.status === "RESOLVED"
                                    ? "success"
                                    : item.status === "IN_PROGRESS"
                                      ? "warning"
                                      : item.status === "NEW"
                                        ? "info"
                                        : "neutral"
                                }
                                dot
                              >
                                {requestLabels[item.status] ?? item.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">
                              {formattedDate}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPreviewItem(item)}
                                >
                                  Ringkasan
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setSelected(item.id)}
                                  leftIcon={
                                    <Eye size={13} className="text-sky-600" />
                                  }
                                >
                                  Buka Pesan
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  <Pagination
                    currentPage={page}
                    totalPages={Math.ceil((query.data.total ?? 0) / 10)}
                    totalItems={query.data.total ?? 0}
                    pageSize={10}
                    onPageChange={setPage}
                    itemName="pesan"
                  />
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
