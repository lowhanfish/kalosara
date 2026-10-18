"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
    <>
      {notice && <p role="status">{notice}</p>}
      {save.isError && (
        <p role="alert">
          {cmsError(save.error)}{" "}
          <button
            onClick={() =>
              void runtime.queryClient.invalidateQueries({
                queryKey: ["user", user.id, "account-profile"],
              })
            }
          >
            Muat ulang
          </button>
        </p>
      )}
      <form
        key={user.updatedAt}
        className="cms-editor"
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
        <h2>Profil saya</h2>
        <p>
          Isi data minimum. Alamat bersifat opsional; jangan masukkan NIK, nomor
          KK atau dokumen identitas.
        </p>
        <label>
          Nama
          <input
            className="cms-input"
            name="displayName"
            required
            maxLength={120}
            autoComplete="name"
            defaultValue={user.profile?.displayName ?? ""}
          />
        </label>
        <label>
          Alamat (opsional)
          <textarea
            className="cms-input"
            name="address"
            aria-label="Alamat (opsional)"
            maxLength={500}
            autoComplete="street-address"
            defaultValue={user.profile?.address ?? ""}
          />
        </label>
        <button className="yellow-button" disabled={busy}>
          Simpan profil
        </button>
      </form>
      <section className="cms-editor">
        <h2>Kontak akun</h2>
        <p>
          Email: {user.email}
          <br />
          Nomor kontak: {user.phone ?? "Belum diisi"}
          <br />
          {user.verifiedAt
            ? "Email pernah diverifikasi petugas."
            : "Kepemilikan email belum diverifikasi."}
        </p>
        {pending && (
          <div className="space-y-3">
            <h3>
              {new Date(pending.expiresAt) <= new Date()
                ? "Permintaan kedaluwarsa"
                : "Menunggu verifikasi petugas"}
            </h3>
            <p>
              Email baru: {pending.newEmail ?? "Tidak diubah"}
              <br />
              Nomor baru: {pending.newPhone ?? "Tidak diubah"}
              <br />
              Batas verifikasi:{" "}
              {new Date(pending.expiresAt).toLocaleString("id-ID")}
            </p>
            <button
              className="cms-edit-button"
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
      <form
        className="cms-editor"
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
        <h2>Ajukan perubahan kontak</h2>
        <p>
          Isi email atau nomor baru. Hubungi petugas untuk memverifikasi
          identitas dan kepemilikan kontak baru. Permintaan ini tidak mengirim
          email/SMS. Setelah disetujui, seluruh sesi dicabut dan Anda masuk
          kembali dengan email terbaru. Permintaan baru menggantikan permintaan
          sebelumnya.
        </p>
        <label>
          Email baru (kosongkan bila tetap)
          <input
            className="cms-input"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
          />
        </label>
        <label>
          Nomor kontak baru (format +62…)
          <input
            className="cms-input"
            name="phone"
            type="tel"
            autoComplete="tel"
            pattern="\+[1-9][0-9]{7,14}"
            maxLength={16}
          />
        </label>
        <label>
          Kata sandi saat ini
          <input
            className="cms-input"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            maxLength={72}
          />
        </label>
        <button className="yellow-button" disabled={busy}>
          Ajukan verifikasi kontak
        </button>
      </form>
      {busy && <p role="status">Menyimpan…</p>}
    </>
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
    <>
      <h1>Profil akun masyarakat</h1>
      {query.isPending && <p role="status">Memuat profil…</p>}
      {query.isError && (
        <p role="alert">
          {cmsError(query.error)}{" "}
          <button
            onClick={async () => {
              await runtime.bootstrap();
              await query.refetch();
            }}
          >
            Coba lagi
          </button>
        </p>
      )}
      {query.data && (
        <ProfileForms key={query.data.user.id} user={query.data.user} />
      )}
    </>
  );
}
