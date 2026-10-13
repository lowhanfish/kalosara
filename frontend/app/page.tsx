import { ApiStatus } from "@/components/api-status";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">KALOSARA</p>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Kanal Layanan Online Surat dan Administrasi Rakyat</h1>
      <p className="max-w-2xl text-lg text-zinc-600">Fondasi website kelurahan Tahap 01 sedang disiapkan. Informasi publik dan pengelolaan konten akan dibangun pada tahap berikutnya.</p>
      <ApiStatus />
    </main>
  );
}
