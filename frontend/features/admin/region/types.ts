import type { Statistic, Place } from "@/lib/region";
export const modules = {
  statistics: "Statistik agregat",
  facilities: "Fasilitas publik",
  potentials: "Potensi lokal",
} as const;
export type Kind = keyof typeof modules;
export type Row = Statistic | Place;
