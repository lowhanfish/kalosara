import type { Metadata } from "next";
import { notFound } from "next/navigation";
export const metadata: Metadata = {
  title: "Berita tidak ditemukan",
  robots: { index: false, follow: false },
};
// A native cached not-found entry preserves HTTP 404 when reached through Proxy.
export default function MissingNews() {
  notFound();
}
