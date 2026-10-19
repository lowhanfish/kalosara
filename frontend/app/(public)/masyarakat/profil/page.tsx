"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  User,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { accountMutation, type Account } from "@/features/account/client";
import { cmsError } from "@/features/cms/client";

function ProfileForms({ user }: { user: Account }) {
  const runtime = useAuthRuntime();
  const [notice, setNotice] = useState("");
  const save = useMutation({
    mutationFn: ({
      path,
      body,
      method,
    }: {
      path: string;
      body: Record<string, unknown>;
      method?: string;
    }) => accountMutation(runtime.request, path, body, method),
    onSuccess: async (_data, variables) => {
      setNotice(
        variables.path === "/account/profile"
          ? "Profil tersimpan."
          : variables.method === "DELETE"
            ? "Permintaan dibatalkan."
            : "Permintaan tercatat. Kontak belum berubah; verifikasi kepemilikan kontak baru kepada petugas dalam 7 hari.",
      );
      await runtime.queryClient.invalidateQueries({
        queryKey: ["user", user.id, "account-profile"],
      });
    },
  });
  const pending = user.contactChange;
  const busy = save.isPending;

  return (
    <div className="space-y-6">
      {notice && (
        <div
          className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          role="status"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
          <p>{notice}</p>
        </div>
      )}
      {save.isError && (
        <div
          className="flex items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-600" />
            <p>{cmsError(save.error)}</p>
          </div>
          <button
            onClick={() =>
              void runtime.queryClient.invalidateQueries({
                queryKey: ["user", user.id, "account-profile"],
              })
            }
            className="shrink-0 font-semibold underline hover:text-rose-900"
          >
            Muat ulang
          </button>
        </div>
      )}

      {/* Profil Form */}
      <form
        key={user.updatedAt}
        className="cms-editor rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          save.mutate({
            path: "/account/profile",
            method: "PATCH",
            body: {
              displayName: String(f.get("displayName")),
              address: String(f.get("address")) || null,
              expectedUpdatedAt: user.updatedAt,
            },
          });
        }}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-primary">
            <User size={20} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-primary">Profil saya</h2>
            <p className="text-xs text-muted">Data identitas tampilan akun warga</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Isi data nama tampilan. Alamat bersifat opsional; demi keamanan data pribadi, jangan masukkan NIK, nomor KK atau mengunggah dokumen identitas di formulir ini.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Nama Lengkap
            </label>
            <input
              className="cms-input mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              name="displayName"
              required
              maxLength={120}
              autoComplete="name"
              defaultValue={user.profile?.displayName ?? ""}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Alamat Domisili (opsional)
            </label>
            <textarea
              className="cms-input mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              name="address"
              aria-label="Alamat (opsional)"
              maxLength={500}
              rows={3}
              autoComplete="street-address"
              defaultValue={user.profile?.address ?? ""}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            className="yellow-button inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
            disabled={busy}
          >
            {busy ? "Menyimpan…" : "Simpan Profil"}
          </button>
        </div>
      </form>

      {/* Kontak Akun */}
      <section className="cms-editor rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-primary">
            <Mail size={20} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-primary">Kontak akun</h2>
            <p className="text-xs text-muted">Email dan nomor telepon resmi yang terdaftar</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Alamat Email
            </p>
            <p className="mt-1 font-semibold text-primary">{user.email}</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
              {user.verifiedAt ? (
                <>
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Email pernah diverifikasi petugas
                </>
              ) : (
                <>
                  <AlertCircle size={13} className="text-amber-600" />
                  Kepemilikan email belum diverifikasi
                </>
              )}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Nomor Kontak
            </p>
            <p className="mt-1 font-semibold text-primary">
              {user.phone ?? "Belum diisi"}
            </p>
            <p className="mt-2 text-xs text-muted">
              Dapat diperbarui melalui permohonan verifikasi kontak
            </p>
          </div>
        </div>

        {pending && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <Clock size={18} className="text-amber-700" />
              <h3>
                {new Date(pending.expiresAt) <= new Date()
                  ? "Permintaan Kedaluwarsa"
                  : "Menunggu Verifikasi Petugas"}
              </h3>
            </div>
            <div className="mt-3 space-y-1 text-sm text-amber-900">
              <p>Email baru: <span className="font-semibold">{pending.newEmail ?? "Tidak diubah"}</span></p>
              <p>Nomor baru: <span className="font-semibold">{pending.newPhone ?? "Tidak diubah"}</span></p>
              <p>Batas verifikasi: <span className="font-semibold">{new Date(pending.expiresAt).toLocaleString("id-ID")}</span></p>
            </div>
            <button
              className="cms-edit-button mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
              disabled={busy}
              onClick={() => {
                if (confirm("Batalkan permintaan perubahan kontak?"))
                  save.mutate({
                    path: `/account/contact-change/${pending.id}`,
                    body: {},
                    method: "DELETE",
                  });
              }}
            >
              Batalkan permintaan
            </button>
          </div>
        )}
      </section>

      {/* Ajukan Perubahan Kontak Form */}
      <form
        className="cms-editor rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (
            !confirm(
              "Ajukan perubahan kontak untuk diverifikasi petugas? Kontak lama tetap berlaku sampai disetujui.",
            )
          )
            return;
          const form = e.currentTarget;
          const f = new FormData(form);
          const email = String(f.get("email")).trim();
          const phone = String(f.get("phone")).trim();
          const body = {
            ...(email ? { newEmail: email } : {}),
            ...(phone ? { newPhone: phone } : {}),
            currentPassword: String(f.get("password")),
          };
          form.reset();
          save.mutate({ path: "/account/contact-change", body });
        }}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-primary">
            <Phone size={20} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-primary">Ajukan perubahan kontak</h2>
            <p className="text-xs text-muted">Perbarui email atau nomor telepon resmi warga</p>
          </div>
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-500">
          Isi email atau nomor baru. Demi keamanan, hubungi petugas kelurahan untuk memverifikasi identitas Anda. Setelah disetujui, seluruh sesi perangkat lama akan dicabut dan Anda masuk kembali menggunakan data terbaru.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Email Baru (kosongkan bila tetap)
            </label>
            <input
              className="cms-input mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              name="email"
              type="email"
              placeholder="emailbaru@domain.com"
              autoComplete="email"
              maxLength={254}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Nomor Kontak Baru (format +62…)
            </label>
            <input
              className="cms-input mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              name="phone"
              type="tel"
              placeholder="+628123456789"
              autoComplete="tel"
              pattern="\+[1-9][0-9]{7,14}"
              maxLength={16}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Konfirmasi Kata Sandi Saat Ini
            </label>
            <input
              className="cms-input mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              name="password"
              type="password"
              placeholder="Masukkan kata sandi untuk otorisasi"
              required
              autoComplete="current-password"
              maxLength={72}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            className="yellow-button inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
            disabled={busy}
          >
            {busy ? "Memproses…" : "Ajukan Verifikasi Kontak"}
            <ArrowRight size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const query = useQuery({
    queryKey: ["user", auth.user?.id, "account-profile"],
    queryFn: () => runtime.request<{ user: Account }>("/account/profile"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">
          Pengaturan Warga
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          Profil akun masyarakat
        </h1>
      </div>

      {query.isPending && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500" role="status">
          <p className="animate-pulse">Memuat profil warga…</p>
        </div>
      )}

      {query.isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800" role="alert">
          <p className="font-semibold">{cmsError(query.error)}</p>
          <button
            onClick={async () => {
              await runtime.bootstrap();
              await query.refetch();
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700"
          >
            Coba lagi
          </button>
        </div>
      )}

      {query.data && (
        <ProfileForms key={query.data.user.id} user={query.data.user} />
      )}
    </div>
  );
}

