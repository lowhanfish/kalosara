import { redirect, notFound } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const routes: Record<string, string> = {
    penduduk: "/statistik",
    apbdes: "/anggaran",
    bansos: "/bansos",
    stunting: "/stunting",
  };
  if (!Object.hasOwn(routes, section)) notFound();
  redirect(routes[section]);
}
