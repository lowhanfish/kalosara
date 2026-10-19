import type { Metadata } from "next";
import { ContentPage } from "@/features/content/public-list";
export const metadata: Metadata = { title: "Informasi publik" };
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <ContentPage kind="documents" searchParams={searchParams} />;
}
