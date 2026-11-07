import { notFound } from "next/navigation";
import { PpidPage, ppidGroups } from "@/features/community/ppid-page";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ group: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { group } = await params;
  if (!Object.hasOwn(ppidGroups, group)) notFound();
  return (
    <PpidPage
      group={group as keyof typeof ppidGroups}
      searchParams={searchParams}
    />
  );
}
