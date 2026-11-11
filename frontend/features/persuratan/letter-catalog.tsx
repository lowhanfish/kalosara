import React from "react";
import { Send, ArrowRight } from "lucide-react";
import { LETTER_DEFINITIONS } from "./letter-definitions";
import { LetterIllustratedIcon } from "./letter-icons";
import type { LetterType } from "./types";

interface LetterCatalogProps {
  onSelectLetter: (type: LetterType) => void;
}

const FEATURED_LETTER_ORDER: LetterType[] = [
  "SKTM",
  "BELUM_MENIKAH",
  "DOMISILI",
  "SKU",
  "BELUM_MEMILIKI_RUMAH",
  "BELUM_BEKERJA",
  "AHLI_WARIS",
  "LAINNYA",
  "PENGANTAR_SKCK",
  "PENGHASILAN",
  "PENGANTAR_NIKAH",
];

export function LetterCatalog({ onSelectLetter }: LetterCatalogProps) {
  const letters = Object.values(LETTER_DEFINITIONS).sort((a, b) => {
    const idxA = FEATURED_LETTER_ORDER.indexOf(a.code);
    const idxB = FEATURED_LETTER_ORDER.indexOf(b.code);
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
            Pilih Jenis Surat yang Dibutuhkan
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Pilih layanan surat di bawah ini. Formulir akan terisi otomatis
            dengan data akun Anda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {letters.map((letter) => {
          return (
            <div
              key={letter.code}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-500/10"
            >
              {/* Paper airplane accent floating at top right */}
              <div className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-sky-50 text-sky-600 transition-transform duration-300 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white">
                <Send
                  size={14}
                  className="-rotate-12 translate-x-px -translate-y-px"
                />
              </div>

              {/* Icon / Illustration Center */}
              <div className="flex flex-col items-center pt-2 text-center">
                <div className="transition-transform duration-300 group-hover:scale-105">
                  <LetterIllustratedIcon
                    type={letter.code}
                    className="h-32 w-32 drop-shadow-md"
                  />
                </div>

                {/* Badge Category */}
                <span className="mt-3 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 group-hover:bg-sky-100 group-hover:text-sky-700">
                  {letter.badge}
                </span>

                {/* Title */}
                <h3 className="mt-2 text-base font-extrabold uppercase tracking-tight text-slate-800 group-hover:text-sky-950">
                  {letter.title}
                </h3>

                {/* Description */}
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                  {letter.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onSelectLetter(letter.code)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-600/20 transition-all hover:from-sky-500 hover:to-blue-600 active:scale-[0.98]"
                >
                  <span>Ajukan Surat</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
