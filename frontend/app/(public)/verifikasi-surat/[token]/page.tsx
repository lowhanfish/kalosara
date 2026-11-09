import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  Calendar,
  User,
  CheckCircle2,
  Download,
  Building2,
  ExternalLink,
} from "lucide-react";
import { LETTER_DEFINITIONS } from "@/features/persuratan/letter-definitions";
import type { LetterType } from "@/features/persuratan/types";

interface VerifyPageProps {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Verifikasi Keaslian Dokumen KALOSARA - Kelurahan Watundehoa",
  description:
    "Layanan verifikasi keaslian surat dan dokumen administrasi resmi bertanda tangan elektronik (TTE) Kelurahan Watundehoa.",
};

interface VerificationData {
  isValid: boolean;
  id: string;
  ticketNumber: string;
  letterNumber: string;
  type: LetterType;
  applicantName: string;
  applicantNik: string;
  signedBy: string;
  signedAt: string;
  pdfUrl: string;
  verifiedAt: string;
}

async function fetchVerification(token: string): Promise<VerificationData | null> {
  const apiUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:4000";

  try {
    const res = await fetch(`${apiUrl}/api/v1/public/letters/verify/${token}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch (err) {
    console.error("Verification fetch error:", err);
    return null;
  }
}

export default async function VerifikasiSuratPage({ params }: VerifyPageProps) {
  const { token } = await params;
  const doc = await fetchVerification(token);

  const def = doc?.type ? LETTER_DEFINITIONS[doc.type] : null;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-500/20 mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Pemerintah Kelurahan Watundehoa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Kecamatan Watunohu, Kabupaten Kolaka Utara, Sulawesi Tenggara
          </p>
          <div className="inline-block mt-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold">
            KALOSARA • Kanal Layanan Online Surat dan Administrasi Rakyat
          </div>
        </div>

        {/* Verification Status Card */}
        {doc && doc.isValid ? (
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-xl overflow-hidden">
            {/* Success Banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-6 text-white text-center sm:text-left sm:flex sm:items-center sm:gap-4">
              <div className="mx-auto sm:mx-0 w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <div className="mt-3 sm:mt-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/50 text-white text-xs font-semibold uppercase tracking-wider mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Terverifikasi Sah
                </div>
                <h2 className="text-lg sm:text-xl font-bold">
                  Dokumen Asli &amp; Terdaftar
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
                  Dokumen ini telah ditandatangani secara elektronik (TTE) dan terdaftar resmi di pangkalan data Kelurahan Watundehoa.
                </p>
              </div>
            </div>

            {/* Document Details */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-100 pb-5">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                  Jenis Surat Resmi
                </span>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {def?.title || doc.type}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    Nomor Surat Resmi
                  </span>
                  <p className="font-mono text-sm font-semibold text-slate-800">
                    {doc.letterNumber || "-"}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    Nomor Tiket KALOSARA
                  </span>
                  <p className="font-mono text-sm font-semibold text-slate-800">
                    {doc.ticketNumber}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    Nama Pemohon
                  </span>
                  <p className="text-sm font-semibold text-slate-800">
                    {doc.applicantName}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    NIK Pemohon
                  </span>
                  <p className="font-mono text-sm font-semibold text-slate-800">
                    {doc.applicantNik}
                  </p>
                </div>
              </div>

              {/* TTE Signer Details */}
              <div className="bg-sky-50/70 rounded-xl p-4 border border-sky-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase font-bold tracking-wider text-sky-900">
                    Tanda Tangan Elektronik (TTE) Sah
                  </h4>
                  <p className="text-sm text-sky-950 font-medium mt-0.5">
                    Ditandatangani oleh: <strong>{doc.signedBy}</strong>
                  </p>
                  <p className="text-xs text-sky-700 mt-0.5">
                    Tanggal Pengesahan:{" "}
                    {new Date(doc.signedAt).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <a
                  href={`/api/v1/public/letters/download/${doc.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold text-sm transition shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Unduh Dokumen Asli PDF
                </a>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  Website Kelurahan
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-rose-200 shadow-xl overflow-hidden p-6 sm:p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Dokumen Tidak Ditemukan atau Belum Sah
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
              Kode QR atau token verifikasi ini tidak terdaftar di sistem KALOSARA Kelurahan Watundehoa, atau dokumen permohonan belum selesai ditandatangani oleh Lurah.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 text-left mb-6">
              <p className="font-semibold mb-1">Catatan Keamanan:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Pastikan Anda memindai kode QR langsung dari dokumen resmi bertandatangan digital.</li>
                <li>Jika Anda merasa ini adalah kekeliruan, silakan hubungi Kantor Kelurahan Watundehoa atau ajukan ulang melalui portal KALOSARA.</li>
              </ul>
            </div>
            <Link
              href="/masyarakat/dashboard"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition"
            >
              Menuju Portal KALOSARA
            </Link>
          </div>
        )}

        {/* Security watermark footer */}
        <div className="text-center mt-8 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Kelurahan Watundehoa. Sistem Persuratan Digital KALOSARA.</p>
          <p className="mt-1">Keaslian dokumen ini dilindungi oleh undang-undang ITE Republik Indonesia.</p>
        </div>
      </div>
    </div>
  );
}
