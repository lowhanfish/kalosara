"use client";

import { useState } from "react";
import Image from "next/image";
import {
  User,
  Phone,
  Building2,
  FileText,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  RotateCcw,
  UserCheck,
  Send,
  HelpCircle,
  Briefcase,
  Users,
  AlertCircle,
} from "lucide-react";
import { siteIdentity } from "@/lib/site-identity";
import { createHttpClient, ApiError } from "@/services/http-client";

export type GuestType = "WARGA" | "KEDINASAN" | "SWASTA_LEMBAGA" | "UMUM";

interface FormData {
  fullName: string;
  phone: string;
  nik: string;
  guestType: GuestType;
  institution: string;
  addressOrRt: string;
  purpose: string;
  notes: string;
  destinationStaff: string;
}

const INITIAL_FORM: FormData = {
  fullName: "",
  phone: "",
  nik: "",
  guestType: "WARGA",
  institution: "",
  addressOrRt: "",
  purpose: "Pelayanan Administrasi & Surat",
  notes: "",
  destinationStaff: "Pelayanan Umum / Staf Piket",
};

const PURPOSE_OPTIONS = [
  "Pelayanan Administrasi & Surat",
  "Konsultasi / Urusan Pertanahan & Sengketa",
  "Urusan Bantuan Sosial (Bansos / BLT)",
  "Audiensi / Bertemu Lurah",
  "Koordinasi / Rapat Kedinasan",
  "Kunjungan Kerja / Studi Banding",
  "Lainnya",
];

const DESTINATION_OPTIONS = [
  "Pelayanan Umum / Staf Piket",
  "Lurah (AMIRULAH, S.Si)",
  "Sekretaris Kelurahan",
  "Seksi Pemerintahan & Trantib",
  "Seksi Kesejahteraan Sosial & Pemberdayaan",
];

export function GuestbookForm({
  siteName = siteIdentity.name,
  locationName = siteIdentity.location,
}: {
  siteName?: string;
  locationName?: string;
}) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedPass, setSubmittedPass] = useState<{
    registrationNumber: string;
    timestamp: string;
    name: string;
    guestType: GuestType;
    purpose: string;
    destination: string;
  } | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
      newErrors.fullName = "Nama lengkap wajib diisi minimal 3 karakter";
    }

    const cleanPhone = formData.phone.replace(/[^0-9]/g, "");
    if (!cleanPhone || cleanPhone.length < 9) {
      newErrors.phone = "Nomor HP/WhatsApp aktif wajib diisi (minimal 9 digit)";
    }

    if (formData.guestType === "KEDINASAN" && !formData.institution.trim()) {
      newErrors.institution = "Nama instansi/kantor dinas wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const http = createHttpClient();
      const { csrfToken } = await http<{ csrfToken: string }>("/auth/csrf");
      const result = await http<{
        ticketNumber: string;
        fullName: string;
        guestType: GuestType;
        purpose: string;
        destinationStaff: string;
        createdAt: string;
      }>("/public/guestbook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(formData),
      });

      const createdAtDate = result?.createdAt
        ? new Date(result.createdAt)
        : new Date();
      const formattedTime = createdAtDate.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      setSubmittedPass({
        registrationNumber: result.ticketNumber,
        timestamp: formattedTime,
        name: result.fullName,
        guestType: result.guestType,
        purpose: result.purpose,
        destination: result.destinationStaff,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setSubmitError(
          "Terlalu banyak permintaan pengisian buku tamu. Mohon tunggu beberapa menit sebelum mencoba lagi.",
        );
      } else if (err instanceof ApiError && err.message) {
        setSubmitError(err.message);
      } else {
        setSubmitError(
          "Terjadi kendala saat mengirim data buku tamu. Silakan periksa koneksi atau coba sesaat lagi.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
    setSubmitError("");
    setSubmittedPass(null);
  };

  if (submittedPass) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-xl shadow-emerald-950/5">
          {/* Header Tiket */}
          <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 p-6 text-center text-white sm:p-8">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <CheckCircle2 className="size-10 text-emerald-100" />
            </div>
            <span className="inline-block rounded-full bg-emerald-500/40 px-3.5 py-1 text-xs font-semibold tracking-wider uppercase text-emerald-100">
              Kunjungan Berhasil Dicatat
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
              Tiket Registrasi Tamu
            </h2>
            <p className="mt-1 text-sm text-emerald-100/90">{siteName}</p>

            <div className="mt-5 inline-block rounded-2xl bg-white/10 px-6 py-2.5 font-mono text-xl font-bold tracking-widest text-white backdrop-blur-md">
              #{submittedPass.registrationNumber}
            </div>
          </div>

          {/* Isi Detail Tiket */}
          <div className="space-y-4 p-6 sm:p-8">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Nama Pengunjung
              </div>
              <div className="mt-1 text-base font-bold text-slate-800">
                {submittedPass.name}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Waktu Kedatangan
                </div>
                <div className="mt-1 text-xs font-medium text-slate-700">
                  {submittedPass.timestamp}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Kategori Tamu
                </div>
                <div className="mt-1 text-xs font-semibold text-primary">
                  {submittedPass.guestType === "WARGA" && "Warga Watundehoa"}
                  {submittedPass.guestType === "KEDINASAN" && "Tamu Kedinasan"}
                  {submittedPass.guestType === "SWASTA_LEMBAGA" &&
                    "Lembaga / Swasta"}
                  {submittedPass.guestType === "UMUM" && "Warga Umum"}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Keperluan Kunjungan
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-800">
                {submittedPass.purpose}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Tujuan: {submittedPass.destination}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-900">
              <span className="font-bold">Langkah Selanjutnya:</span>
              <p className="mt-0.5">
                Silakan duduk di ruang tunggu pelayanan atau menuju meja staf
                piket. Petugas kelurahan akan segera memanggil nama Anda sesuai
                antrean.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50"
            >
              <RotateCcw className="size-4 text-slate-500" />
              Isi Buku Tamu untuk Orang Lain
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-10">
      {/* Banner Identitas Kantor */}
      <div className="mb-6 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex items-center gap-4">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-2 shadow-xs">
            <Image
              src={siteIdentity.logo}
              alt="Logo Konawe"
              fill
              className="object-contain p-1"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary">
              <ShieldCheck className="size-3.5 text-primary" />
              Presensi Tamu Resmi
            </div>
            <h1 className="mt-1 text-xl font-black tracking-tight text-primary sm:text-2xl">
              Buku Tamu Digital
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm">
              {siteName} &bull; {locationName}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <Clock className="size-4 text-amber-600" />
          <span>Pelayanan Tatap Muka: Senin – Jumat (08.00 – 15.30 WITA)</span>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8"
      >
        {/* Kategori Tamu */}
        <div>
          <label className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
            1. Kategori Pengunjung <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              {
                id: "WARGA" as GuestType,
                label: "Warga Desa/Kel.",
                desc: "Warga Watundehoa",
                icon: UserCheck,
              },
              {
                id: "KEDINASAN" as GuestType,
                label: "Kedinasan",
                desc: "Kecamatan / OPD",
                icon: Briefcase,
              },
              {
                id: "SWASTA_LEMBAGA" as GuestType,
                label: "Lembaga / Mitra",
                desc: "LSM / Perusahaan",
                icon: Building2,
              },
              {
                id: "UMUM" as GuestType,
                label: "Tamu Umum",
                desc: "Luar Wilayah",
                icon: Users,
              },
            ].map((cat) => {
              const Icon = cat.icon;
              const isSelected = formData.guestType === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, guestType: cat.id }))
                  }
                  className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all outline-none focus:outline-none focus-visible:outline-none ${
                    isSelected
                      ? "border-primary bg-primary text-white shadow-md shadow-primary/15"
                      : "border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <Icon
                    className={`mb-1 size-5 ${
                      isSelected ? "text-amber-300" : "text-slate-500"
                    }`}
                  />
                  <span className="text-xs font-bold">{cat.label}</span>
                  <span
                    className={`mt-0.5 text-[10px] ${
                      isSelected ? "text-slate-200" : "text-slate-400"
                    }`}
                  >
                    {cat.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Data Diri */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600"
            >
              2. Nama Lengkap Tamu <span className="text-rose-500">*</span>
            </label>
            <div
              className={`flex items-center rounded-xl border bg-white transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
                errors.fullName
                  ? "border-rose-500 ring-1 ring-rose-500"
                  : "border-slate-300 hover:border-slate-400"
              }`}
            >
              <div className="flex w-11 shrink-0 items-center justify-center text-slate-400">
                <User className="size-5" />
              </div>
              <input
                id="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                }
                placeholder="Contoh: Bpk. Herman Susanto"
                className="min-h-12 w-full rounded-r-xl bg-transparent py-2.5 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:outline-none focus-visible:outline-none"
              />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-xs text-rose-500">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600"
            >
              3. No. WhatsApp / HP Aktif{" "}
              <span className="text-rose-500">*</span>
            </label>
            <div
              className={`flex items-center rounded-xl border bg-white transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
                errors.phone
                  ? "border-rose-500 ring-1 ring-rose-500"
                  : "border-slate-300 hover:border-slate-400"
              }`}
            >
              <div className="flex w-11 shrink-0 items-center justify-center text-slate-400">
                <Phone className="size-5" />
              </div>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="Contoh: 081234567890"
                className="min-h-12 w-full rounded-r-xl bg-transparent py-2.5 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:outline-none focus-visible:outline-none"
              />
            </div>
            {errors.phone ? (
              <p className="mt-1 text-xs text-rose-500">{errors.phone}</p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-400">
                Digunakan untuk konfirmasi atau notifikasi layanan bila
                diperlukan.
              </p>
            )}
          </div>

          {/* Kondisional jika Tamu Kedinasan / Mitra */}
          {formData.guestType === "KEDINASAN" ||
          formData.guestType === "SWASTA_LEMBAGA" ? (
            <div>
              <label
                htmlFor="institution"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Nama Instansi / Kantor / Lembaga{" "}
                <span className="text-rose-500">*</span>
              </label>
              <div
                className={`flex items-center rounded-xl border bg-white transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
                  errors.institution
                    ? "border-rose-500 ring-1 ring-rose-500"
                    : "border-slate-300 hover:border-slate-400"
                }`}
              >
                <div className="flex w-11 shrink-0 items-center justify-center text-slate-400">
                  <Building2 className="size-5" />
                </div>
                <input
                  id="institution"
                  type="text"
                  required
                  value={formData.institution}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      institution: e.target.value,
                    }))
                  }
                  placeholder="Contoh: Kantor Camat Puriala / Dinas Kependudukan"
                  className="min-h-12 w-full rounded-r-xl bg-transparent py-2.5 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:outline-none focus-visible:outline-none"
                />
              </div>
              {errors.institution && (
                <p className="mt-1 text-xs text-rose-500">
                  {errors.institution}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label
                htmlFor="addressOrRt"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Alamat / Lingkungan / RT / RW (Opsional)
              </label>
              <div className="flex items-center rounded-xl border border-slate-300 bg-white transition-all hover:border-slate-400 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <div className="flex w-11 shrink-0 items-center justify-center text-slate-400">
                  <MapPin className="size-5" />
                </div>
                <input
                  id="addressOrRt"
                  type="text"
                  value={formData.addressOrRt}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      addressOrRt: e.target.value,
                    }))
                  }
                  placeholder="Contoh: RT 02 / Lingkungan 1 Watundehoa"
                  className="min-h-12 w-full rounded-r-xl bg-transparent py-2.5 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:outline-none focus-visible:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Keperluan & Tujuan */}
        <div className="space-y-4 border-t border-slate-100 pt-5">
          <div>
            <label
              htmlFor="purpose"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600"
            >
              4. Keperluan Kunjungan <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center rounded-xl border border-slate-300 bg-white transition-all hover:border-slate-400 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <div className="flex w-11 shrink-0 items-center justify-center text-slate-400">
                <FileText className="size-5" />
              </div>
              <select
                id="purpose"
                value={formData.purpose}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, purpose: e.target.value }))
                }
                className="min-h-12 w-full cursor-pointer rounded-r-xl bg-transparent py-2.5 pr-4 text-sm text-slate-800 outline-none focus:outline-none focus-visible:outline-none"
              >
                {PURPOSE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="destinationStaff"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600"
            >
              5. Pejabat / Seksi yang Dituju
            </label>
            <div className="flex items-center rounded-xl border border-slate-300 bg-white transition-all hover:border-slate-400 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <div className="flex w-11 shrink-0 items-center justify-center text-slate-400">
                <UserCheck className="size-5" />
              </div>
              <select
                id="destinationStaff"
                value={formData.destinationStaff}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    destinationStaff: e.target.value,
                  }))
                }
                className="min-h-12 w-full cursor-pointer rounded-r-xl bg-transparent py-2.5 pr-4 text-sm text-slate-800 outline-none focus:outline-none focus-visible:outline-none"
              >
                {DESTINATION_OPTIONS.map((dest) => (
                  <option key={dest} value={dest}>
                    {dest}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="notes"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600"
            >
              Keterangan Tambahan / Ringkasan Keperluan (Opsional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Contoh: Mengurus Surat Keterangan Usaha (SKU) atau koordinasi penyaluran bantuan"
              className="min-h-24 w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-800 placeholder:text-slate-400 transition-all hover:border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none focus:outline-none focus-visible:outline-none"
            />
          </div>
        </div>

        {/* Info Privasi */}
        <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-500">
          <HelpCircle className="size-4 shrink-0 text-slate-400" />
          <span>
            Data Anda tersimpan dengan aman di server internal kelurahan dan
            hanya digunakan untuk keperluan administrasi pelayanan kantor.
          </span>
        </div>

        {submitError && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
            <AlertCircle className="size-4 shrink-0 text-rose-500" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Tombol Kirim */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover active:scale-[0.99] disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Mencatat Kunjungan...</span>
          ) : (
            <>
              <Send className="size-4.5 text-amber-300" />
              <span>Kirim Data Kunjungan</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
