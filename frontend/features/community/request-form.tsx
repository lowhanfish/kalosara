"use client";
import { useState } from "react";
import { createHttpClient } from "@/services/http-client";
import { cmsError } from "@/features/cms/client";
export function PublicRequestForm({
  kind,
}: {
  kind: "COMPLAINT" | "INFORMATION";
}) {
  const [pending, setPending] = useState(false);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  return reference ? (
    <section
      role="status"
      className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7"
    >
      <h2 className="text-xl font-bold text-emerald-900">
        {kind === "COMPLAINT" ? "Pengaduan" : "Permohonan"} berhasil diterima
      </h2>
      <p className="mt-3">Simpan nomor referensi ini:</p>
      <p className="mt-3 break-all rounded-lg bg-white p-4 font-mono text-sm font-semibold">
        {reference}
      </p>
      <p className="mt-4 text-sm text-emerald-900">
        Pesan tersimpan di kotak masuk pengelola. Petugas dapat menghubungi Anda
        melalui kontak yang diberikan. Tidak ada email atau WhatsApp otomatis.
      </p>
    </section>
  ) : (
    <form
      className="community-form rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        if (pending) return;
        const form = e.currentTarget;
        const fields = new FormData(form);
        const email = String(fields.get("email") ?? "").trim();
        const phone = String(fields.get("phone") ?? "").trim();
        if (!email && !phone) {
          setError(
            "Isi email atau nomor telepon agar petugas dapat menindaklanjuti.",
          );
          return;
        }
        if (phone && !/^\+?[\d ()-]{6,30}$/.test(phone)) {
          setError("Periksa format nomor telepon Anda.");
          return;
        }
        setPending(true);
        setError("");
        try {
          const http = createHttpClient();
          const { csrfToken } = await http<{ csrfToken: string }>("/auth/csrf");
          const result = await http<{ reference: string }>(
            "/public/community/requests",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken,
              },
              body: JSON.stringify({
                kind,
                name: fields.get("name"),
                organization: fields.get("organization") || "",
                email,
                phone,
                subject: fields.get("subject"),
                message: fields.get("message"),
                consent: fields.get("consent") === "on",
              }),
            },
          );
          setReference(result.reference);
          form.reset();
        } catch (err) {
          setError(cmsError(err));
        } finally {
          setPending(false);
        }
      }}
    >
      <p className="mb-6 rounded-lg bg-slate-50 p-4 text-sm text-muted">
        Pesan dan kontak Anda hanya dapat dibaca petugas yang berwenang. Jangan
        menyertakan NIK, nomor KK, kata sandi, atau data medis pribadi.
      </p>
      <fieldset
        disabled={pending}
        className="grid min-w-0 gap-5 sm:grid-cols-2"
      >
        <legend className="sr-only">Identitas dan pesan</legend>
        <label>
          Nama lengkap
          <input
            className="cms-input"
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={120}
          />
        </label>
        {kind === "INFORMATION" && (
          <label>
            Asal instansi (opsional)
            <input className="cms-input" name="organization" maxLength={200} />
          </label>
        )}
        <label>
          Email
          <input
            className="cms-input"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
          />
        </label>
        <label>
          Telepon / WhatsApp
          <input
            className="cms-input"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={30}
          />
        </label>
        <p className="text-xs text-muted sm:col-span-2">
          Isi setidaknya satu kontak: email atau telepon, agar petugas dapat
          menindaklanjuti.
        </p>
        <label className="sm:col-span-2">
          Judul / pokok {kind === "COMPLAINT" ? "pengaduan" : "permohonan"}
          <input
            className="cms-input"
            name="subject"
            required
            minLength={5}
            maxLength={200}
          />
        </label>
        <label className="sm:col-span-2">
          {kind === "COMPLAINT" ? "Isi pengaduan" : "Informasi yang dimohonkan"}
          <textarea
            className="cms-input"
            name="message"
            required
            minLength={20}
            maxLength={5000}
            rows={7}
          />
          <span className="mt-2 block text-xs font-normal text-muted">
            20–5.000 karakter. Formulir ini belum menerima lampiran.
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm sm:col-span-2">
          <input
            className="mt-1 size-4 shrink-0"
            type="checkbox"
            name="consent"
            required
          />
          <span>
            Saya menyetujui penggunaan nama, kontak, dan pesan untuk
            menindaklanjuti{" "}
            {kind === "COMPLAINT" ? "pengaduan" : "permohonan informasi"} ini.
          </span>
        </label>
        <button className="navy-button justify-self-start sm:col-span-2">
          {pending
            ? "Mengirim…"
            : "Kirim " + (kind === "COMPLAINT" ? "pengaduan" : "permohonan")}
        </button>
      </fieldset>
      {error && (
        <p
          role="alert"
          className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
    </form>
  );
}
