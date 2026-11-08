"use client";

import { useState } from "react";
import {
  History,
  Compass,
  ShieldCheck,
  Building2,
  MessageSquareQuote,
  Users,
  MapPin,
  ChevronDown,
  Calendar,
  ChevronsUpDown,
} from "lucide-react";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import { MotionHoverCard } from "@/components/ui/motion";
import type { PublicProfile } from "@/lib/profile";
import type { SiteSettings } from "@/lib/site-settings";

interface ProfileAccordionProps {
  profile: PublicProfile;
  settings: SiteSettings;
}

export function ProfileAccordion({ profile, settings }: ProfileAccordionProps) {
  // Semua card default tertutup sesuai preferensi pengguna
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const allKeys = [
    "sejarah",
    "visi-misi",
    "tugas-fungsi",
    "struktur-organisasi",
    "sambutan-lurah",
    "aparatur",
    "lokasi",
  ];

  const allOpen = allKeys.every((key) => openSections[key]);

  const toggleAll = () => {
    if (allOpen) {
      setOpenSections({});
    } else {
      const next: Record<string, boolean> = {};
      allKeys.forEach((key) => {
        next[key] = true;
      });
      setOpenSections(next);
    }
  };

  const sectionsConfig = [
    {
      id: "sejarah",
      label: "Sejarah",
      subtitle: "Perjalanan dan rekam jejak kelurahan",
      icon: History,
      color: "from-amber-500/10 to-amber-600/5 text-amber-700",
      type: "cms" as const,
    },
    {
      id: "visi-misi",
      label: "Visi dan Misi",
      subtitle: "Arah pembangunan dan pengabdian",
      icon: Compass,
      color: "from-blue-500/10 to-blue-600/5 text-blue-700",
      type: "cms" as const,
    },
    {
      id: "tugas-fungsi",
      label: "Tugas dan Fungsi",
      subtitle: "Peran dalam tata kelola pelayanan",
      icon: ShieldCheck,
      color: "from-emerald-500/10 to-emerald-600/5 text-emerald-700",
      type: "cms" as const,
    },
    {
      id: "struktur-organisasi",
      label: "Struktur Organisasi",
      subtitle: "Tata susunan perangkat kelurahan",
      icon: Building2,
      color: "from-indigo-500/10 to-indigo-600/5 text-indigo-700",
      type: "cms" as const,
    },
    {
      id: "sambutan-lurah",
      label: "Sambutan Lurah",
      subtitle: "Pesan dari pimpinan wilayah",
      icon: MessageSquareQuote,
      color: "from-teal-500/10 to-teal-600/5 text-teal-700",
      type: "cms" as const,
    },
    {
      id: "aparatur",
      label: "Aparatur Kelurahan",
      subtitle: "Perangkat Kelurahan",
      icon: Users,
      color: "from-rose-500/10 to-rose-600/5 text-rose-700",
      type: "officials" as const,
    },
    {
      id: "lokasi",
      label: "Alamat dan Peta Wilayah",
      subtitle: "Lokasi Kantor",
      icon: MapPin,
      color: "from-amber-500/10 to-amber-600/5 text-amber-700",
      type: "location" as const,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2">
        <p className="text-xs font-medium text-slate-500">
          Klik judul di bawah untuk melihat rincian informasi profil kelurahan.
        </p>
        <button
          type="button"
          onClick={toggleAll}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-primary transition-colors"
        >
          <ChevronsUpDown size={14} className="text-slate-400" />
          {allOpen ? "Tutup Semua" : "Buka Semua"}
        </button>
      </div>

      <div className="space-y-3.5">
        {sectionsConfig.map((section) => {
          const isOpen = Boolean(openSections[section.id]);
          const Icon = section.icon;

          let titleText = section.label;
          let contentNode = null;

          if (section.type === "cms") {
            const page = profile.pages.find((p) => p.slug === section.id);
            titleText = page?.title ?? section.label;

            contentNode = page?.content ? (
              page.content.includes("<") ? (
                <div
                  className="cms-rich text-sm leading-relaxed text-slate-600 sm:text-[15px]"
                  dangerouslySetInnerHTML={{ __html: page.content }}
                />
              ) : (
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                  {page.content}
                </p>
              )
            ) : (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-400 italic">
                Materi resmi belum dipublikasikan oleh pihak kelurahan.
              </p>
            );
          } else if (section.type === "officials") {
            contentNode = (
              <div>
                {profile.officials.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 italic">
                    Daftar aparatur resmi belum dipublikasikan.
                  </p>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {profile.officials.map((official) => (
                      <MotionHoverCard
                        className="group flex flex-col items-center rounded-xl border border-slate-100 bg-slate-50/60 p-5 text-center transition-all hover:border-slate-200 hover:bg-white hover:shadow-md"
                        key={official.id}
                      >
                        {official.photoUrl ? (
                          <div className="relative h-44 w-36 overflow-hidden rounded-xl bg-slate-200 shadow-xs transition-transform duration-300 group-hover:scale-105">
                            <SkeletonImage
                              src={official.photoUrl}
                              alt={official.name}
                              fill
                              unoptimized
                              className="object-cover object-top"
                            />
                          </div>
                        ) : (
                          <div
                            aria-hidden="true"
                            className="grid h-44 w-36 place-items-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-3xl font-bold text-slate-400 shadow-xs"
                          >
                            {official.name
                              .split(" ")
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")}
                          </div>
                        )}
                        <h3 className="mt-4 font-bold text-slate-900 transition-colors group-hover:text-primary">
                          {official.name}
                        </h3>
                        <p className="text-xs font-semibold text-primary">
                          {official.position}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {official.unit}
                        </p>
                        {(official.termStart || official.termEnd) && (
                          <p className="mt-3 flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] text-muted">
                            <Calendar className="h-3 w-3" />
                            {official.termStart?.slice(0, 10) ?? "—"} s/d{" "}
                            {official.termEnd?.slice(0, 10) ?? "—"}
                          </p>
                        )}
                      </MotionHoverCard>
                    ))}
                  </div>
                )}
              </div>
            );
          } else if (section.type === "location") {
            contentNode = (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                  {settings.address ?? "Alamat kantor belum diisi."}
                </p>
                {settings.latitude != null && settings.longitude != null ? (
                  <div>
                    <a
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-slate-800"
                      href={`https://www.openstreetmap.org/?mlat=${settings.latitude}&mlon=${settings.longitude}#map=16/${settings.latitude}/${settings.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="h-3.5 w-3.5 text-amber-400" />
                      Buka peta kantor di OpenStreetMap
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-muted italic">
                    Koordinat kantor belum diisi.
                  </p>
                )}
              </div>
            );
          }

          return (
            <div
              key={section.id}
              id={section.id}
              className={`portal-card overflow-hidden rounded-2xl border transition-all duration-200 ${
                isOpen
                  ? "border-primary/30 bg-white shadow-md shadow-slate-200/40"
                  : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                aria-expanded={isOpen}
                aria-controls={`content-${section.id}`}
                className="group flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  <div
                    className={`grid size-11 sm:size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${section.color} border border-slate-200/60 shadow-2xs transition-transform duration-200 group-hover:scale-105`}
                  >
                    <Icon size={20} className="sm:size-[22px]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-primary">
                      {section.subtitle}
                    </p>
                    <h2 className="mt-0.5 text-base sm:text-lg font-bold text-slate-900 transition-colors group-hover:text-primary">
                      {titleText}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`hidden text-xs font-medium sm:inline-block transition-colors ${
                      isOpen ? "text-primary" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  >
                    {isOpen ? "Tutup" : "Lihat rincian"}
                  </span>
                  <div
                    className={`grid size-8 place-items-center rounded-lg border transition-all duration-300 ${
                      isOpen
                        ? "rotate-180 border-primary/20 bg-primary/10 text-primary"
                        : "border-slate-200 bg-slate-50 text-slate-400 group-hover:border-slate-300 group-hover:bg-slate-100 group-hover:text-slate-700"
                    }`}
                  >
                    <ChevronDown size={16} />
                  </div>
                </div>
              </button>

              {isOpen && (
                <div
                  id={`content-${section.id}`}
                  className="border-t border-slate-100 bg-white px-5 pt-5 pb-6 sm:px-7 sm:pt-6 sm:pb-7 animate-in fade-in-50 duration-200"
                >
                  {contentNode}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
