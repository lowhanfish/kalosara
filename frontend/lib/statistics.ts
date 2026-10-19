import type { Statistic } from "./region";

export const validCount = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

export function chronologicalStatistics(items: Statistic[]) {
  return [...items].sort((a, b) => a.period.localeCompare(b.period));
}

export function genderComposition(item: Statistic) {
  if (!validCount(item.male) || !validCount(item.female)) return null;
  const total = item.male + item.female;
  if (total === 0) return null;
  return {
    total,
    malePercent: (item.male / total) * 100,
    femalePercent: (item.female / total) * 100,
  };
}

export function chartMaximum(values: (number | null)[]) {
  const highest = Math.max(0, ...values.filter(validCount));
  if (!highest) return 1;
  const step = 10 ** Math.floor(Math.log10(highest));
  return Math.ceil(highest / step) * step;
}

export function statisticPeriod(period: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) return period;
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${period}-01T00:00:00Z`));
}
