import { PpidPage } from "@/features/community/ppid-page";
export const metadata = { title: "PPID dan keterbukaan informasi" };
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <PpidPage searchParams={searchParams} />;
}
