import type { Metadata } from "next";
import { PublicSection } from "@/components/site/public-section";
export const metadata: Metadata = { title: "Galeri" };
export default function Page() {
  return <PublicSection href="/galeri" />;
}
