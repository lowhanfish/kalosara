"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  QrCode,
  Printer,
  X,
  ShieldCheck,
  Smartphone,
  Loader2,
} from "lucide-react";
import QRCode from "qrcode";
import { siteIdentity } from "@/lib/site-identity";

export function PrintQrModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [currentUrl, setCurrentUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://watundehoa.kelurahan.id";
    const targetUrl = `${origin}/buku-tamu`;

    QRCode.toDataURL(targetUrl, {
      width: 360,
      margin: 2,
      color: {
        dark: "#082d58",
        light: "#ffffff",
      },
    })
      .then((url) => {
        setQrDataUrl(url);
        setCurrentUrl(targetUrl);
      })
      .catch((err) => {
        console.error("Gagal generate QR Code:", err);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs print:static print:bg-white print:p-0 print:overflow-visible">
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl print:max-h-none print:w-full print:rounded-none print:shadow-none print:border-none">
        {/* Header Kontrol (Hanya tampil di layar, tidak ikut tercetak) */}
        <div className="flex items-center justify-between border-b border-slate-200 p-5 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <QrCode className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Cetak Standing QR Meja Resepsionis
              </h3>
              <p className="text-xs text-slate-500">
                Pajang lembar ini pada standing acrylic di meja pelayanan kantor
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

        {/* Action Button (Layar) */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-3 print:hidden">
          <span className="text-xs text-slate-500">
            Ukuran disarankan: Kertas A5 atau A4
          </span>
          <button
            onClick={handlePrint}
            disabled={!qrDataUrl}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-hover active:scale-95 disabled:opacity-50"
          >
            <Printer className="size-4" />
            <span>Cetak Standing QR</span>
          </button>
        </div>

        {/* Standing Desk Poster (Siap Cetak - Area Bersih) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 print:p-0 print:overflow-visible">
          <div
            id="print-qr-sheet"
            className="printable-sheet mx-auto flex max-w-[380px] flex-col items-center rounded-3xl border-2 border-slate-800 bg-white p-8 text-center text-slate-900 shadow-sm print:border-2 print:border-slate-800 print:shadow-none print:m-0 print:p-6 print:pt-4"
          >
            <div className="relative mb-3 size-20">
              <Image
                src={siteIdentity.logo}
                alt="Logo Kabupaten Konawe"
                fill
                className="object-contain"
              />
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold tracking-widest uppercase text-slate-700">
              Pemerintah Kabupaten Konawe
            </span>
            <h2 className="mt-1.5 text-lg font-black tracking-tight text-primary sm:text-xl">
              KANTOR KELURAHAN WATUNDEHOA
            </h2>
            <p className="text-xs font-medium text-slate-500">
              Kecamatan Puriala &bull; Sulawesi Tenggara
            </p>

            <div className="my-5 h-px w-full bg-slate-200" />

            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
              <ShieldCheck className="size-4 text-emerald-600" />
              Presensi & Buku Tamu Digital
            </div>

            <h3 className="mt-2 text-xl font-black text-slate-900">
              SILAKAN SCAN DI SINI
            </h3>
            <p className="text-xs text-slate-600">
              Gunakan kamera smartphone Anda untuk mengisi buku tamu
            </p>

            {/* QR Code Container (Offline generated Data URL) */}
            <div className="my-5 flex size-56 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-900 bg-white p-2 shadow-md">
              {!qrDataUrl ? (
                <div className="flex flex-col items-center justify-center text-xs text-slate-400">
                  <Loader2 className="mb-2 size-6 animate-spin text-primary" />
                  <span>Membuat QR Code...</span>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={qrDataUrl}
                  alt="QR Code Buku Tamu Digital"
                  className="size-full object-contain"
                />
              )}
            </div>

            <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-xs leading-relaxed text-slate-700">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                <Smartphone className="size-4 text-primary" />
                <span>3 Langkah Cepat:</span>
              </div>
              <ol className="list-inside list-decimal space-y-1 text-[11px]">
                <li>Buka kamera smartphone Anda.</li>
                <li>Arahkan ke kode QR di atas dan klik tautan.</li>
                <li>Isi nama & keperluan Anda, lalu tunggu giliran.</li>
              </ol>
            </div>

            <p className="mt-4 font-mono text-[10px] text-slate-400">
              {currentUrl || "https://watundehoa.kelurahan.id/buku-tamu"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
