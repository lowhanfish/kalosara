import type { Statistic, Place, RegionList } from "@/lib/region";

export const modules = {
  statistics: "Statistik agregat",
  facilities: "Fasilitas publik",
  potentials: "Potensi lokal",
} as const;

export type Kind = keyof typeof modules;
export type Row = Statistic | Place;
export type CreateInterface = Row;
export type ResponseInterface = Row;
export type ResponseListInterface = RegionList<Row>;
