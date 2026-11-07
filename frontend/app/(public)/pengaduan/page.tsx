import { MessageSquare } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import { PublicRequestForm } from "@/features/community/request-form";
export const metadata = {
  title: "Pengaduan masyarakat",
  robots: { index: false, follow: true },
};
export default function Page() {
  return (
    <main id="konten" className="container max-w-4xl pb-16">
      <PageHeading
        title="Pengaduan masyarakat"
        description="Sampaikan masukan atau persoalan terkait pelayanan dan lingkungan kelurahan kepada pengelola."
        icon={MessageSquare}
      />
      <PublicRequestForm kind="COMPLAINT" />
    </main>
  );
}
