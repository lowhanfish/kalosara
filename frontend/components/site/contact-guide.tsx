"use client";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
export function ContactGuide() {
  const router = useRouter();
  return (
    <form
      className="rounded-card border border-border bg-white p-6"
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get("topic");
        if (
          value === "/pelayanan" ||
          value === "/informasi-publik" ||
          value === "/profil"
        )
          router.push(value);
      }}
    >
      <h2 className="text-xl font-semibold">
        Informasi apa yang Anda perlukan?
      </h2>
      <p className="mt-3 text-sm text-muted">
        Pilih topik untuk membuka halaman terkait. Formulir ini tidak mengirim
        pesan atau data pribadi.
      </p>
      <div className="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
        <div className="w-full flex-1">
          <label
            className="mb-2 block text-sm font-medium"
            htmlFor="contact-topic"
          >
            Topik informasi
          </label>
          <Select id="contact-topic" name="topic">
            <option value="/pelayanan">Panduan pelayanan</option>
            <option value="/informasi-publik">Informasi publik</option>
            <option value="/profil">Profil kelurahan</option>
          </Select>
        </div>
        <Button type="submit" className="shrink-0">
          Buka informasi
        </Button>
      </div>
    </form>
  );
}
