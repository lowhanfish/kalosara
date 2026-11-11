import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Paperclip,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { LETTER_DEFINITIONS } from "./letter-definitions";
import type { LetterType } from "./types";

interface LetterRequestModalProps {
  type: LetterType | null;
  onClose: () => void;
  onSubmit: (
    formData: Record<string, unknown>,
    attachments: File[],
  ) => Promise<void>;
  initialUserData?: {
    displayName?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  };
}

export function LetterRequestModal({
  type,
  onClose,
  onSubmit,
  initialUserData,
}: LetterRequestModalProps) {
  // Base profile fields
  const [applicantName, setApplicantName] = useState(
    initialUserData?.displayName ?? "",
  );
  const [applicantNik, setApplicantNik] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [religion, setReligion] = useState("Islam");
  const [gender, setGender] = useState("Laki-laki");
  const [maritalStatus, setMaritalStatus] = useState("Belum Kawin");
  const [occupation, setOccupation] = useState("Wiraswasta / Pekerja Bebas");
  const [address, setAddress] = useState(initialUserData?.address ?? "");

  // Dynamic type-specific fields
  const [details, setDetails] = useState<Record<string, string>>({});

  // Multiple File Attachments
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (type) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [type]);

  if (!type) return null;
  const letterMeta = LETTER_DEFINITIONS[type];

  const handleFieldChange = (name: string, value: string) => {
    setDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validFiles: File[] = [];
      for (const file of filesArray) {
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} melebihi batas 10MB`);
          continue;
        }
        validFiles.push(file);
      }
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!applicantName.trim()) {
      setErrorMessage("Nama Pengusul wajib diisi.");
      return;
    }
    if (!applicantNik.trim() || applicantNik.length < 16) {
      setErrorMessage("NIK Pengusul wajib diisi 16 digit.");
      return;
    }
    if (!birthPlace.trim() || !birthDate) {
      setErrorMessage("Tempat dan tanggal lahir wajib diisi.");
      return;
    }
    if (!address.trim()) {
      setErrorMessage("Alamat lengkap pemohon wajib diisi.");
      return;
    }

    // Validate required dynamic fields
    for (const f of letterMeta.fields) {
      if (f.required && !details[f.name]?.trim()) {
        setErrorMessage(`Field "${f.label}" wajib diisi.`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const payload: Record<string, unknown> = {
        type,
        applicantName,
        applicantNik,
        birthPlace,
        birthDate,
        gender,
        religion,
        maritalStatus,
        occupation,
        address,
        details,
      };
      await onSubmit(payload, selectedFiles);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengirim permohonan surat.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl my-8 overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Blue Header - Styled identically to the reference image */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-600 to-blue-700 text-white select-none shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-extrabold uppercase tracking-wide">
              TAMBAH DATA : {letterMeta.shortTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
            aria-label="Tutup form"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {errorMessage && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-sm">
              <AlertCircle
                size={18}
                className="shrink-0 mt-0.5 text-rose-600"
              />
              <div>
                <p className="font-semibold">Mohon periksa isian Anda:</p>
                <p className="mt-0.5 text-xs text-rose-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Section 1: Profil & Identitas Pemohon */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                1. Data Identitas Pemohon
              </h3>
              <p className="text-xs text-slate-500">
                Data otomatis terisi dari akun warga Anda. Silakan sesuaikan
                jika diperlukan.
              </p>
            </div>

            {/* Nama Pengusul */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pengusul <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="Masukkan nama lengkap sesuai KTP"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-sky-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* NIK */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NIK (Nomor Induk Kependudukan){" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={16}
                value={applicantNik}
                onChange={(e) =>
                  setApplicantNik(e.target.value.replace(/\D/g, ""))
                }
                placeholder="16 Digit NIK KTP"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-mono text-slate-900 transition focus:border-sky-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Tempat & Tanggal Lahir (2 Column layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tempat Lahir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="Kota / Kabupaten Kelahiran"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-sky-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Lahir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-sky-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Agama & Jenis Kelamin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agama <span className="text-rose-500">*</span>
                </label>
                <select
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-sky-500 focus:bg-white focus:outline-none"
                >
                  <option value="Islam">Islam</option>
                  <option value="Kristen Protestan">Kristen Protestan</option>
                  <option value="Katolik">Katolik</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddha">Buddha</option>
                  <option value="Khonghucu">Khonghucu</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Kelamin <span className="text-rose-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-sky-500 focus:bg-white focus:outline-none"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
            </div>

            {/* Status Perkawinan & Pekerjaan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Perkawinan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-sky-500 focus:bg-white focus:outline-none"
                >
                  <option value="Belum Kawin">Belum Kawin</option>
                  <option value="Kawin">Kawin</option>
                  <option value="Cerai Hidup">Cerai Hidup</option>
                  <option value="Cerai Mati">Cerai Mati</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pekerjaan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-sky-500 focus:bg-white focus:outline-none"
                >
                  <option value="Petani / Pekebun">Petani / Pekebun</option>
                  <option value="Nelayan / Perikanan">
                    Nelayan / Perikanan
                  </option>
                  <option value="Wiraswasta / Pedagang">
                    Wiraswasta / Pedagang
                  </option>
                  <option value="Karyawan Swasta">Karyawan Swasta</option>
                  <option value="PNS / PPPK / TNI / Polri">
                    PNS / PPPK / TNI / Polri
                  </option>
                  <option value="Pelajar / Mahasiswa">
                    Pelajar / Mahasiswa
                  </option>
                  <option value="Mengurus Rumah Tangga">
                    Mengurus Rumah Tangga
                  </option>
                  <option value="Belum / Tidak Bekerja">
                    Belum / Tidak Bekerja
                  </option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            {/* Alamat Lengkap */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Sesuai KTP / Domisili{" "}
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Contoh: Jl. Poros Watunohu RT 02 Dusun I Kel. Watundehoa"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-sky-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Isian Spesifik Surat */}
          <div className="space-y-4 pt-2">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                2. Data Khusus {letterMeta.shortTitle}
              </h3>
              <p className="text-xs text-slate-500">
                Informasi detail yang akan dimuat dalam lembar surat keterangan.
              </p>
            </div>

            {letterMeta.fields.map((field) => {
              if (field.type === "select") {
                return (
                  <div key={field.name}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {field.label}{" "}
                      {field.required && (
                        <span className="text-rose-500">*</span>
                      )}
                    </label>
                    <select
                      value={details[field.name] ?? field.options?.[0] ?? ""}
                      onChange={(e) =>
                        handleFieldChange(field.name, e.target.value)
                      }
                      required={field.required}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-sky-500 focus:bg-white focus:outline-none"
                    >
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              if (field.type === "textarea") {
                return (
                  <div key={field.name}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {field.label}{" "}
                      {field.required && (
                        <span className="text-rose-500">*</span>
                      )}
                    </label>
                    <textarea
                      rows={2}
                      value={details[field.name] ?? ""}
                      onChange={(e) =>
                        handleFieldChange(field.name, e.target.value)
                      }
                      placeholder={field.placeholder}
                      required={field.required}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-sky-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                );
              }

              return (
                <div key={field.name}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {field.label}{" "}
                    {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type={field.type}
                    value={details[field.name] ?? ""}
                    onChange={(e) =>
                      handleFieldChange(field.name, e.target.value)
                    }
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
              );
            })}
          </div>

          {/* Section 3: Lampiran Dokumen (Multiple Files) */}
          <div className="space-y-4 pt-2">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                3. Unggah Berkas Lampiran
              </h3>
              <p className="text-xs text-slate-500">
                Dipersyaratkan: {letterMeta.requirements.join(", ")}. Bisa
                berupa file PDF atau Foto Kamera HP (JPG/PNG).
              </p>
            </div>

            {/* Dropzone / Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-sky-300 rounded-2xl bg-sky-50/40 hover:bg-sky-50/80 transition-colors group"
            >
              <div className="grid size-12 place-items-center rounded-2xl bg-sky-100 text-sky-600 group-hover:scale-105 transition-transform">
                <Paperclip size={24} />
              </div>
              <p className="mt-3 text-sm font-bold text-sky-900">
                Klik untuk memilih file lampiran
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Pilih satu atau beberapa file (PDF, JPG, PNG, WEBP, maks 10MB
                per file)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* List of Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  File Terpilih ({selectedFiles.length}):
                </p>
                <div className="grid gap-2">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-700">
                          <FileText size={16} />
                        </span>
                        <div className="truncate">
                          <p className="truncate text-xs font-semibold text-slate-800">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {(file.size / 1024).toFixed(0)} KB •{" "}
                            {file.type || "Dokumen"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Hapus file"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-600/20 transition hover:from-sky-500 hover:to-blue-600 disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Mengirimkan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Kirim Permohonan Surat</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
