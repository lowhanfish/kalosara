import { FileQuestion } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import { PublicRequestForm } from "@/features/community/request-form";
export const metadata = {
  title: "Permohonan informasi PPID",
  robots: { index: false, follow: true },
};
export default function Page() {
  return (
    <main id="konten" className="container max-w-4xl pb-16">
      <PageHeading
        title="Permohonan informasi"
        description="Jelaskan informasi yang dibutuhkan beserta tujuan permohonan agar petugas dapat menindaklanjutinya."
        icon={FileQuestion}
      />
      <PublicRequestForm kind="INFORMATION" />
    </main>
  );
}
