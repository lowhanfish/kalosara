import React from "react";
import { ShieldCheck, Sparkles, CheckCircle2, Clock } from "lucide-react";

export function KalosaraBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-blue-50/60 p-6 sm:p-8 shadow-sm">
      {/* Decorative background circle gradients */}
      <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 size-64 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start sm:items-center gap-5">
          {/* Logo Badge Icon */}
          <div className="grid size-16 sm:size-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 text-white shadow-lg shadow-sky-600/25 ring-4 ring-white">
            <svg
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="size-11 sm:size-14 drop-shadow"
            >
              {/* Kalosara Rotan Motif Circle */}
              <circle
                cx="50"
                cy="50"
                r="38"
                stroke="#fde047"
                strokeWidth="6"
                strokeDasharray="14 3"
              />
              <circle
                cx="50"
                cy="50"
                r="30"
                stroke="#ffffff"
                strokeWidth="3"
                fill="#0369a1"
              />
              {/* Quill / Letter Icon */}
              <path d="M36 64L42 46L62 34L66 38L54 58L36 64Z" fill="#ffffff" />
              <path d="M36 64L40 56L44 60L36 64Z" fill="#fde047" />
              <circle cx="50" cy="50" r="4" fill="#ffffff" />
            </svg>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 border border-sky-200 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-sky-800">
                <Sparkles size={12} className="text-sky-600" />
                Portal Pelayanan Resmi
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 size={12} className="text-emerald-600" />
                Gratis / Rp 0
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              <span className="bg-gradient-to-r from-sky-600 to-blue-800 bg-clip-text text-transparent">
                KALOSARA
              </span>
            </h1>

            <p className="text-sm sm:text-base font-bold text-sky-950">
              Kanal Layanan Online Surat dan Administrasi Rakyat
            </p>

            <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-600 leading-relaxed">
              Pelayanan permohonan persuratan mandiri Kelurahan Watundehoa
              secara digital, terintegrasi verifikasi administrasi dan Tanda
              Tangan Elektronik (TTE) Lurah.
            </p>
          </div>
        </div>

        {/* Feature Badges list */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 shrink-0 text-xs">
          <div className="rounded-xl border border-sky-100 bg-white/80 p-3 shadow-xs">
            <p className="font-bold text-slate-800 flex items-center gap-1">
              <ShieldCheck size={14} className="text-sky-600" />
              TTE & QR Code
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Surat anti-pemalsuan
            </p>
          </div>
          <div className="rounded-xl border border-sky-100 bg-white/80 p-3 shadow-xs">
            <p className="font-bold text-slate-800 flex items-center gap-1">
              <Clock size={14} className="text-sky-600" />
              Tracking Berkas
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Pantau status real-time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
