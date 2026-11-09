"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UserCheck,
  ArrowLeft,
  Search,
  RotateCw,
  Mail,
  Phone,
  Clock,
  X,
  Eye,
} from "lucide-react";
import {
  AdminLoading,
  AdminError,
  AdminEmptyState,
} from "@/components/admin/feedback";
import { UserVerifiedSvg } from "@/components/admin/admin-icons";
import { AdminAccess } from "@/features/cms/admin-access";
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
import type { PendingContactChange } from "./types";
import { useResponseListMaster } from "./hooks/crud";
import { FormReviewKontakModal } from "./components/FormReviewKontakModal";
import { DetailKontakModal } from "./components/DetailKontakModal";

function Reviews() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PendingContactChange | null>(null);
  const [detailItem, setDetailItem] = useState<PendingContactChange | null>(
    null,
  );

  const query = useResponseListMaster({ page, search });

  return (
    <div className="space-y-6">
      {/* Return to Users Bar */}
      <div className="glass-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
        <Link
          href="/admin/pengguna"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-sky-600 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Manajemen Pengguna</span>
        </Link>

        <span className="text-xs font-medium text-slate-500">
          Kontak lama tetap berlaku sampai proses verifikasi selesai.
        </span>
      </div>

      {/* Search and Refresh */}
      <div className="glass-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="cms-input pl-10 pr-9 text-xs w-full"
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

        <Button
          variant="secondary"
          size="sm"
          onClick={() => void query.refetch()}
          leftIcon={
            <RotateCw
              size={13}
              className={query.isFetching ? "animate-spin text-sky-600" : ""}
            />
          }
        >
          Segarkan Data
        </Button>
      </div>

      {/* Modals */}
      {selected && (
        <FormReviewKontakModal
          key={selected.id}
          item={selected}
          onClose={() => setSelected(null)}
        />
      )}
      <DetailKontakModal
        isOpen={detailItem !== null}
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onReview={(item) => setSelected(item)}
      />

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
            <Card padding="sm" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead>Akun Pemohon</TableHead>
                    <TableHead>Perubahan yang Diajukan</TableHead>
                    <TableHead>Status & Batas Waktu</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.items.map((item, idx) => {
                    const isExpired = new Date(item.expiresAt) <= new Date();
                    const formattedDate = new Date(
                      item.expiresAt,
                    ).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-center font-bold text-slate-400 text-xs">
                          {listindex(10, page, idx)}
                        </TableCell>
                        <TableCell>
                          <span className="font-extrabold text-slate-900 text-sm">
                            {item.user.email}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-1.5">
                              <Mail size={12} className="text-sky-600" />
                              <span>
                                Email:{" "}
                                <strong>{item.newEmail ?? "Tetap"}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone size={12} className="text-sky-600" />
                              <span>
                                Telepon:{" "}
                                <strong>{item.newPhone ?? "Tetap"}</strong>
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge
                              variant={isExpired ? "neutral" : "warning"}
                              dot
                            >
                              {isExpired
                                ? "Kedaluwarsa"
                                : "Menunggu Verifikasi"}
                            </Badge>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock size={11} />
                              {formattedDate}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDetailItem(item)}
                              leftIcon={<Eye size={13} />}
                            >
                              Detail
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelected(item)}
                              leftIcon={<UserCheck size={13} />}
                            >
                              Tinjau Permintaan
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
                itemName="permintaan"
              />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default function VerifikasiKontakPage() {
  return (
    <main className="min-w-0 space-y-6">
      <PageHeader
        title="Verifikasi Perubahan Kontak"
        description="Tinjau dan verifikasi pengajuan perubahan alamat email atau nomor telepon dari warga terdaftar."
        icon={UserVerifiedSvg}
        badge={{ text: "Verifikasi Identitas", variant: "sky" }}
      />
      <AdminAccess>
        <Reviews />
      </AdminAccess>
    </main>
  );
}
