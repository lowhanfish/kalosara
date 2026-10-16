import type { Metadata } from "next";
import { PublicSection } from "@/components/site/public-section";
export const metadata: Metadata = { title: "Informasi publik" };
export default function Page() {
  return <PublicSection href="/informasi-publik" />;
}
