import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Kelola profil kelurahan",
  robots: { index: false, follow: false },
};
export default function ProfileEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
