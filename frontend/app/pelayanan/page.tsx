import type { Metadata } from "next";
import { PublicSection } from "@/components/site/public-section";
import { getPublicProfile } from "@/lib/profile";
import { Breadcrumb } from "@/components/ui/breadcrumb";
export const metadata: Metadata = { title: "Pelayanan" };
export default async function Page() {
  const profile = await getPublicProfile();
  const page = profile.pages.find((p) => p.slug === "pelayanan");
  if (!page) return <PublicSection href="/pelayanan" />;
  return (
    <main id="konten" tabIndex={-1} className="container pb-16">
      <Breadcrumb
        items={[{ label: "Beranda", href: "/" }, { label: "Pelayanan" }]}
      />
      <h1 className="display-title my-8 text-4xl">{page.title}</h1>
      <article className="whitespace-pre-wrap leading-8 max-w-3xl">
        {page.content}
      </article>
    </main>
  );
}
