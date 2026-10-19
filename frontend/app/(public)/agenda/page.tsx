import type { Metadata } from "next";
import { ContentPage } from "@/features/content/public-list";
export const metadata: Metadata = { title: "Agenda" };
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <ContentPage kind="events" searchParams={searchParams} />;
}
