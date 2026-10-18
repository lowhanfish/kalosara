"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
    <>
      <h1>Keamanan akun</h1>
      <form
        className="cms-editor"
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
        <h2>Ubah kata sandi</h2>
        <p>
          Gunakan minimal 12 karakter, maksimal 72 byte. Sesi perangkat ini
          tetap aktif.
        </p>
        <label>
          Kata sandi saat ini
          <input
            className="cms-input"
            name="currentPassword"
            type="password"
            required
            maxLength={72}
            autoComplete="current-password"
          />
        </label>
        <label>
          Kata sandi baru
          <input
            className="cms-input"
            name="newPassword"
            type="password"
            required
            minLength={12}
            maxLength={72}
            autoComplete="new-password"
          />
        </label>
        <label>
          Ulangi kata sandi baru
          <input
            className="cms-input"
            name="confirmPassword"
            type="password"
            required
            minLength={12}
            maxLength={72}
            autoComplete="new-password"
          />
        </label>
        <label>
          <input name="revoke" type="checkbox" defaultChecked />
          Cabut sesi perangkat lain (disarankan)
        </label>
        <button className="yellow-button" disabled={change.isPending}>
          {change.isPending ? "Memproses…" : "Ubah kata sandi"}
        </button>
        {change.isError && <p role="alert">{cmsError(change.error)}</p>}
        {notice && <p role="status">{notice}</p>}
      </form>
    </>
  );
}
