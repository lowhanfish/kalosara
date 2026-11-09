"use client";

import { useState } from "react";
import Image from "next/image";
import { Printer, Calendar, X } from "lucide-react";
import { siteIdentity } from "@/lib/site-identity";
import { useGuestBookList } from "../hooks/crud";
import type { GuestBookItem } from "../types";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function PrintReportModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const currentDate = new Date();
  const [reportType, setReportType] = useState<"MONTH" | "YEAR">("MONTH");
  const [selectedMonth, setSelectedMonth] = useState<number>(
    currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    currentDate.getFullYear(),
  );

  const formattedMonthStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

  const { data, isLoading } = useGuestBookList({
    limit: 500,
    page: 1,
    month: reportType === "MONTH" ? formattedMonthStr : undefined,
    year: reportType === "YEAR" ? String(selectedYear) : undefined,
  });

  const items: GuestBookItem[] = data?.items ?? [];

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const periodLabel =
    reportType === "MONTH"
      ? `Bulan ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
      : `Tahun ${selectedYear}`;

  const printDateLabel = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs print:static print:bg-white print:p-0 print:overflow-visible">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl print:max-h-none print:w-full print:rounded-none print:shadow-none print:border-none">
        {/* Header Kontrol (Hanya tampil di layar, tidak ikut tercetak) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Printer className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Cetak Laporan Rekapitulasi Buku Tamu
              </h3>
              <p className="text-xs text-slate-500">
                Sesuaikan periode bulan atau tahun sebelum mencetak atau
                menyimpan PDF
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Filter Periode Cetak (Layar) */}
        <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 bg-slate-50/80 px-6 py-3.5 text-xs print:hidden">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Calendar className="size-4 text-primary" />
            <span>Periode Laporan:</span>
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setReportType("MONTH")}
              className={`rounded-md px-3 py-1 font-semibold transition-all ${
                reportType === "MONTH"
                  ? "bg-primary text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Per Bulan
            </button>
            <button
              type="button"
              onClick={() => setReportType("YEAR")}
              className={`rounded-md px-3 py-1 font-semibold transition-all ${
                reportType === "YEAR"
                  ? "bg-primary text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Per Tahun
            </button>
          </div>

          {reportType === "MONTH" && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-800 focus:outline-none"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-800 focus:outline-none"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-hover active:scale-95 disabled:opacity-50"
            >
              <Printer className="size-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>

        {/* Lembar Dokumen Siap Cetak (A4 Layout) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 print:p-0 print:overflow-visible">
          <div
            id="print-sheet"
            className="printable-sheet mx-auto max-w-[800px] bg-white text-slate-900 print:shadow-none print:border-none print:m-0 print:p-0 print:pt-0"
          >
            {/* Kop Surat Kedinasan */}
            <div className="border-b-[3px] border-double border-slate-900 pb-3 text-center">
              <div className="flex items-center justify-center gap-4">
                <div className="relative size-16 shrink-0 sm:size-20">
                  <Image
                    src={siteIdentity.logo}
                    alt="Logo Kabupaten Konawe"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-semibold tracking-wider uppercase sm:text-base">
                    Pemerintah Kabupaten Konawe
                  </h4>
                  <h3 className="text-base font-bold tracking-wider uppercase sm:text-lg">
                    Kecamatan Puriala
                  </h3>
                  <h2 className="text-lg font-black tracking-widest uppercase sm:text-2xl">
                    Kelurahan Watundehoa
                  </h2>
                  <p className="text-[10px] text-slate-600 sm:text-xs">
                    Alamat: {siteIdentity.location} &bull; Kode Pos 93452
                  </p>
                </div>
              </div>
            </div>

            {/* Judul Laporan */}
            <div className="my-6 text-center">
              <h3 className="text-sm font-black uppercase tracking-wider underline sm:text-base">
                Laporan Rekapitulasi Buku Tamu & Kunjungan Pelayanan
              </h3>
              <p className="mt-1 text-xs font-semibold text-slate-700">
                Periode: {periodLabel}
              </p>
            </div>

            {/* Tabel Rekapitulasi Tamu */}
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Memuat data kunjungan tamu...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-xs text-slate-500">
                Tidak ada data kunjungan tamu pada periode {periodLabel}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[11px] leading-tight">
                  <thead>
                    <tr className="border-y border-slate-400 bg-slate-100 text-slate-800">
                      <th className="border border-slate-300 px-2 py-2 text-center">
                        No
                      </th>
                      <th className="border border-slate-300 px-2 py-2 text-left">
                        Tanggal & Waktu
                      </th>
                      <th className="border border-slate-300 px-2 py-2 text-left">
                        Nama Pengunjung
                      </th>
                      <th className="border border-slate-300 px-2 py-2 text-left">
                        No. HP
                      </th>
                      <th className="border border-slate-300 px-2 py-2 text-left">
                        Kategori / Asal
                      </th>
                      <th className="border border-slate-300 px-2 py-2 text-left">
                        Keperluan & Tujuan
                      </th>
                      <th className="border border-slate-300 px-2 py-2 text-center">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const dt = new Date(item.createdAt);
                      const formattedDt = dt.toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      const originText =
                        item.institution ||
                        item.addressOrRt ||
                        (item.guestType === "WARGA"
                          ? "Warga Kelurahan"
                          : "Umum");

                      return (
                        <tr
                          key={item.id}
                          className="border-b border-slate-200 hover:bg-slate-50"
                        >
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-medium">
                            {index + 1}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">
                            {formattedDt}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 font-bold text-slate-800">
                            {item.fullName}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">
                            {item.phone}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5">
                            <span className="font-medium text-slate-700">
                              {originText}
                            </span>
                            <span className="block text-[9px] text-slate-400">
                              ({item.guestType})
                            </span>
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5">
                            <span className="font-semibold text-slate-800">
                              {item.purpose}
                            </span>
                            <span className="block text-[9px] text-slate-500">
                              Tujuan: {item.destinationStaff}
                            </span>
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center whitespace-nowrap">
                            <span
                              className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                item.status === "SERVED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : item.status === "WAITING"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {item.status === "SERVED"
                                ? "Selesai"
                                : item.status === "WAITING"
                                  ? "Menunggu"
                                  : "Batal"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Ringkasan Jumlah Tamu */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <p>
                Total Rekapitulasi: <strong>{items.length} Tamu Terdaftar</strong>
              </p>
              <p className="text-[11px] text-slate-400">
                Selesai:{" "}
                {items.filter((i) => i.status === "SERVED").length} | Menunggu:{" "}
                {items.filter((i) => i.status === "WAITING").length}
              </p>
            </div>

            {/* Kolom Tanda Tangan Pengesahan Lurah */}
            <div className="mt-12 flex justify-end text-xs">
              <div className="w-64 text-center">
                <p>Watundehoa, {printDateLabel}</p>
                <p className="mt-1 font-bold">Lurah Watundehoa,</p>
                <div className="h-20" />
                <p className="font-bold underline uppercase">
                  {siteIdentity.leader}
                </p>
                <p className="text-[11px] text-slate-500">
                  NIP. 19741231 200501 1 012
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
