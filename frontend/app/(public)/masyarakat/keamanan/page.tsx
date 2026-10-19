"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { accountMutation } from "@/features/account/client";
import { cmsError } from "@/features/cms/client";

export default function SecurityPage() {
  const runtime = useAuthRuntime();
  const auth = useAuth();
  const [notice, setNotice] = useState("");
  const change = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      accountMutation(runtime.request, "/account/password", body),
    onSuccess: async () => {
      setNotice(
        "Kata sandi berubah. Sesi ini tetap aktif; pilihan pencabutan sesi lain sudah diterapkan. Permintaan kontak yang belum diverifikasi dibatalkan.",
      );
      await runtime.queryClient.invalidateQueries({
        queryKey: ["user", auth.user?.id, "account-profile"],
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">
          Perlindungan Akun
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          Keamanan akun
        </h1>
      </div>

      {notice && (
        <div
          className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          role="status"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
          <p>{notice}</p>
        </div>
      )}

      {change.isError && (
        <div
          className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          role="alert"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-600" />
          <p>{cmsError(change.error)}</p>
        </div>
      )}

      <form
        className="cms-editor rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const f = new FormData(form);
          if (f.get("newPassword") !== f.get("confirmPassword")) {
            setNotice("Ulangi kata sandi baru dengan nilai yang sama.");
            return;
          }
          if (!confirm("Ubah kata sandi akun ini?")) return;
          const body = {
            currentPassword: String(f.get("currentPassword")),
            newPassword: String(f.get("newPassword")),
            revokeOtherSessions: f.get("revoke") === "on",
          };
          form.reset();
          setNotice("");
          change.mutate(body);
        }}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-primary">
            <KeyRound size={20} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-primary">Ubah kata sandi</h2>
            <p className="text-xs text-muted">Perbarui kata sandi untuk melindungi akun Anda</p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs leading-5 text-slate-600">
          <p className="font-semibold text-slate-700">Ketentuan Keamanan Sandi:</p>
          <ul className="mt-1.5 list-disc pl-4 space-y-0.5">
            <li>Gunakan minimal 12 karakter (maksimal 72 byte).</li>
            <li>Kombinasikan huruf besar, kecil, angka, dan simbol.</li>
            <li>Sesi login pada perangkat yang sedang Anda gunakan saat ini akan tetap aktif.</li>
          </ul>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Kata Sandi Saat Ini
            </label>
            <input
              className="cms-input mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              name="currentPassword"
              type="password"
              placeholder="Masukkan kata sandi lama"
              required
              maxLength={72}
              autoComplete="current-password"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Kata Sandi Baru
            </label>
            <input
              className="cms-input mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              name="newPassword"
              type="password"
              placeholder="Minimal 12 karakter"
              required
              minLength={12}
              maxLength={72}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Ulangi Kata Sandi Baru
            </label>
            <input
              className="cms-input mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              name="confirmPassword"
              type="password"
              placeholder="Ketik ulang kata sandi baru"
              required
              minLength={12}
              maxLength={72}
              autoComplete="new-password"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <input
                name="revoke"
                type="checkbox"
                defaultChecked
                className="size-4 rounded border-slate-300 accent-primary focus:ring-primary"
              />
              Cabut sesi perangkat lain yang sedang aktif (sangat disarankan)
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            className="yellow-button inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
            disabled={change.isPending}
          >
            <Lock size={15} />
            {change.isPending ? "Memproses…" : "Ubah Kata Sandi"}
          </button>
        </div>
      </form>
    </div>
  );
}

