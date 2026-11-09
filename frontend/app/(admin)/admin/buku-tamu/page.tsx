"use client";

import { useState } from "react";
import {
  Users,
  Clock,
  CheckCircle2,
  Calendar,
  Search,
  Printer,
  QrCode,
  RotateCw,
  Eye,
  Phone,
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
import {
  useGuestBookList,
  useGuestBookStats,
  useUpdateGuestBookStatus,
} from "./hooks/crud";
import type { GuestBookItem, GuestStatus, GuestType } from "./types";
import { DetailModal } from "./components/DetailModal";
import { PrintReportModal } from "./components/PrintReportModal";
import { PrintQrModal } from "./components/PrintQrModal";

const MONTH_OPTIONS = [
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

export default function BukuTamuAdminPage() {
  const auth = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<GuestStatus | "">("");
  const [guestType, setGuestType] = useState<GuestType | "">("");

  // Filter Waktu
  const [periodFilter, setPeriodFilter] = useState<
    "ALL" | "TODAY" | "MONTH" | "YEAR"
  >("ALL");

  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(
    String(now.getMonth() + 1).padStart(2, "0"),
  );
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));

  // Modals state
  const [selectedDetail, setSelectedDetail] = useState<GuestBookItem | null>(
    null,
  );
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  const [isPrintQrOpen, setIsPrintQrOpen] = useState(false);

  // Computed Date parameters
  const dateParam =
    periodFilter === "TODAY"
      ? now.toISOString().slice(0, 10)
      : undefined;
  const monthParam =
    periodFilter === "MONTH" ? `${filterYear}-${filterMonth}` : undefined;
  const yearParam = periodFilter === "YEAR" ? filterYear : undefined;

  const { data, isLoading, error, refetch, isFetching } = useGuestBookList({
    page,
    limit: 10,
    search,
    status,
    guestType,
    date: dateParam,
    month: monthParam,
    year: yearParam,
  });

  const { data: stats } = useGuestBookStats();

  const updateStatusMutation = useUpdateGuestBookStatus();

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  const canEdit = auth.user?.role === "ADMIN_KELURAHAN";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Buku Tamu Digital"
        description="Presensi dan pencatatan kunjungan pelayanan tatap muka di Kantor Kelurahan Watundehoa."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPrintQrOpen(true)}
              className="flex items-center gap-1.5"
            >
              <QrCode className="size-4" />
              <span>Cetak QR Meja</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsPrintReportOpen(true)}
              className="flex items-center gap-1.5 bg-primary text-white hover:bg-primary-hover"
            >
              <Printer className="size-4" />
              <span>Cetak Laporan Rekap</span>
            </Button>
          </div>
        }
      />

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4.5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Tamu Hari Ini</p>
              <p className="text-2xl font-black text-slate-900">
                {stats?.todayTotal ?? 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4.5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                Menunggu Pelayanan
              </p>
              <p className="text-2xl font-black text-amber-600">
                {stats?.todayWaiting ?? 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4.5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                Selesai Hari Ini
              </p>
              <p className="text-2xl font-black text-emerald-600">
                {stats?.todayServed ?? 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4.5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <Calendar className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                Total Riwayat Tamu
              </p>
              <p className="text-2xl font-black text-slate-900">
                {stats?.totalAllTime ?? 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Pencarian */}
          <div className="relative lg:col-span-2">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama, tiket, instansi, atau keperluan..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Filter Periode */}
          <div>
            <select
              value={periodFilter}
              onChange={(e) => {
                setPeriodFilter(
                  e.target.value as "ALL" | "TODAY" | "MONTH" | "YEAR",
                );
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-primary focus:outline-none"
            >
              <option value="ALL">Semua Waktu</option>
              <option value="TODAY">Hari Ini Saja</option>
              <option value="MONTH">Filter Per Bulan</option>
              <option value="YEAR">Filter Per Tahun</option>
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as GuestStatus | "");
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-primary focus:outline-none"
            >
              <option value="">Semua Status</option>
              <option value="WAITING">Menunggu Pelayanan</option>
              <option value="SERVED">Selesai Dilayani</option>
              <option value="CANCELLED">Dibatalkan</option>
            </select>
          </div>

          {/* Filter Kategori */}
          <div>
            <select
              value={guestType}
              onChange={(e) => {
                setGuestType(e.target.value as GuestType | "");
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-primary focus:outline-none"
            >
              <option value="">Semua Kategori</option>
              <option value="WARGA">Warga Kelurahan</option>
              <option value="KEDINASAN">Tamu Kedinasan</option>
              <option value="SWASTA_LEMBAGA">Mitra / Swasta</option>
              <option value="UMUM">Tamu Umum</option>
            </select>
          </div>
        </div>

        {/* Sub-filter jika memilih Per Bulan atau Per Tahun */}
        {(periodFilter === "MONTH" || periodFilter === "YEAR") && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs">
            <span className="font-semibold text-slate-600">
              Tentukan Periode:
            </span>

            {periodFilter === "MONTH" && (
              <select
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}

            <select
              value={filterYear}
              onChange={(e) => {
                setFilterYear(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={String(y)}>
                  Tahun {y}
                </option>
              ))}
            </select>

            <button
              onClick={() => refetch()}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
            >
              <RotateCw className={`size-3 ${isFetching ? "animate-spin" : ""}`} />
              Segarkan Data
            </button>
          </div>
        )}
      </Card>

      {/* Tabel Data Tamu */}
      <Card>
        {isLoading ? (
          <AdminLoading label="Memuat catatan buku tamu..." />
        ) : error ? (
          <AdminError error={error} onRetry={() => refetch()} />
        ) : items.length === 0 ? (
          <AdminEmptyState
            title="Belum Ada Tamu Terdaftar"
            description="Belum ada riwayat kunjungan tamu sesuai filter yang Anda pilih."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>Waktu & Tiket</TableHead>
                  <TableHead>Nama Pengunjung</TableHead>
                  <TableHead>Kategori & Asal</TableHead>
                  <TableHead>Keperluan & Tujuan</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => {
                  const dt = new Date(item.createdAt);
                  const formattedTime = dt.toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const originText =
                    item.institution ||
                    item.addressOrRt ||
                    (item.guestType === "WARGA" ? "Warga Desa/Kel." : "Umum");

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-center font-medium text-slate-500">
                        {(page - 1) * 10 + index + 1}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-primary">
                          #{item.ticketNumber}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {formattedTime}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="font-bold text-slate-800">
                          {item.fullName}
                        </p>
                        <a
                          href={`tel:${item.phone}`}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-primary"
                        >
                          <Phone className="size-3" />
                          {item.phone}
                        </a>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-slate-700">
                          {originText}
                        </p>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                          {item.guestType}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-slate-800">
                          {item.purpose}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Tujuan: {item.destinationStaff}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            item.status === "SERVED"
                              ? "success"
                              : item.status === "WAITING"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {item.status === "SERVED"
                            ? "Selesai"
                            : item.status === "WAITING"
                              ? "Menunggu"
                              : "Batal"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedDetail(item)}
                            title="Lihat Detail Kunjungan"
                            className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary"
                          >
                            <Eye className="size-4" />
                          </button>

                          {canEdit && item.status === "WAITING" && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: item.id,
                                  status: "SERVED",
                                  servedBy:
                                    auth.user?.role || "Petugas Pelayanan",
                                })
                              }
                              title="Tandai Selesai Dilayani"
                              className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            >
                              <CheckCircle2 className="size-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Paginasi */}
        {pagination && pagination.totalPages > 1 && (
          <div className="border-t border-slate-100 p-4">
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              onPageChange={setPage}
              itemName="kunjungan"
            />
          </div>
        )}
      </Card>

      {/* Modal Detail Tamu */}
      <DetailModal
        item={selectedDetail}
        onClose={() => setSelectedDetail(null)}
        canEdit={canEdit}
      />

      {/* Modal Cetak Laporan Rekapitulasi (Bulan / Tahun) */}
      <PrintReportModal
        isOpen={isPrintReportOpen}
        onClose={() => setIsPrintReportOpen(false)}
      />

      {/* Modal Cetak Standing QR Meja */}
      <PrintQrModal
        isOpen={isPrintQrOpen}
        onClose={() => setIsPrintQrOpen(false)}
      />
    </div>
  );
}
