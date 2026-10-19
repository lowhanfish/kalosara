"use client";
import { AdminLoading, AdminError } from "@/components/admin/feedback";
import { AdminPageHeader } from "@/components/admin/page-header";
import { UserCheck } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminAccess } from "@/features/cms/admin-access";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsError, type List } from "@/features/cms/client";
import { accountMutation, type ContactChange } from "@/features/account/client";
type Pending = ContactChange & {
  userId: string;
  user: { email: string; phone: string | null };
};
function ReviewForm({ item, onClose }: { item: Pending; onClose: () => void }) {
  const runtime = useAuthRuntime();
  const [approve, setApprove] = useState(new Date(item.expiresAt) > new Date());
  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      accountMutation(
        runtime.request,
        `/admin/contact-changes/${item.id}/review`,
        body,
      ),
    onSuccess: async () => {
      await runtime.queryClient.invalidateQueries({ queryKey: ["user"] });
      onClose();
    },
  });
  return (
    <form
      className="cms-editor"
      onSubmit={(e) => {
        e.preventDefault();
        if (
          !confirm(
            approve
              ? "Setujui kontak baru setelah verifikasi nyata? Semua sesi pemilik akan dicabut."
              : "Tolak dan hapus permintaan kontak ini?",
          )
        )
          return;
        const form = e.currentTarget;
        const f = new FormData(form);
        const body = {
          decision: approve ? "APPROVE" : "REJECT",
          currentPassword: String(f.get("password")),
          identityVerified: f.get("identity") === "on",
          contactOwnershipVerified: f.get("ownership") === "on",
        };
        form.reset();
        mutation.mutate(body);
      }}
    >
      <h2>Verifikasi kontak: {item.user.email}</h2>
      <p>
        Pastikan identitas pemilik dan penguasaan email/nomor baru melalui
        prosedur kantor. Jangan menyetujui hanya berdasarkan nama atau
        pernyataan pemohon. Tidak ada email/SMS otomatis. Jangan masukkan foto
        KTP, kode verifikasi atau bukti sensitif ke aplikasi.
      </p>
      <p>
        Email baru: {item.newEmail ?? "Tetap"}
        <br />
        Nomor baru: {item.newPhone ?? "Tetap"}
      </p>
      <label>
        Keputusan
        <select
          className="cms-input"
          value={approve ? "APPROVE" : "REJECT"}
          onChange={(e) => setApprove(e.target.value === "APPROVE")}
        >
          <option
            value="APPROVE"
            disabled={new Date(item.expiresAt) <= new Date()}
          >
            Setujui setelah verifikasi
          </option>
          <option value="REJECT">Tolak permintaan</option>
        </select>
      </label>
      <label>
        Kata sandi admin
        <input
          name="password"
          className="cms-input"
          type="password"
          required
          maxLength={72}
          autoComplete="current-password"
        />
      </label>
      <label>
        <input name="identity" type="checkbox" required />
        Identitas pemilik telah diverifikasi.
      </label>
      <label>
        <input name="ownership" type="checkbox" required={approve} />
        Kepemilikan kontak baru telah diverifikasi secara nyata.
      </label>
      <div className="cms-pagination">
        <button className="yellow-button" disabled={mutation.isPending}>
          Simpan keputusan
        </button>
        <button type="button" disabled={mutation.isPending} onClick={onClose}>
          Batal
        </button>
      </div>
      {mutation.isPending && <p role="status">Menyimpan…</p>}
      {mutation.isError && (
        <p role="alert">
          {cmsError(mutation.error)} Muat ulang daftar sebelum mencoba lagi.
        </p>
      )}
    </form>
  );
}
function Reviews() {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Pending | null>(null);
  const query = useQuery({
    queryKey: ["user", auth.user?.id, "contact-reviews", page, search],
    queryFn: () =>
      runtime.request<List<Pending>>(
        `/admin/contact-changes?page=${page}&search=${encodeURIComponent(search)}`,
      ),
  });
  return (
    <>
      <p>
        Permintaan email/nomor masyarakat. Kontak lama tetap digunakan sampai
        verifikasi dan persetujuan selesai.
      </p>
      <label className="block">
        Cari email akun
        <input
          className="cms-input"
          value={search}
          maxLength={100}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </label>
      <button className="cms-edit-button" onClick={() => void query.refetch()}>
        Muat ulang
      </button>
      {selected && (
        <ReviewForm
          key={selected.id}
          item={selected}
          onClose={() => setSelected(null)}
        />
      )}{" "}
      {query.isPending && <AdminLoading />}
      {query.isError && (
        <AdminError error={query.error} onRetry={() => void query.refetch()} />
      )}
      {query.data && (
        <>
          {query.data.items.length === 0 && (
            <p>Belum ada permintaan verifikasi kontak.</p>
          )}
          <ul className="cms-content-list cms-management-list">
            {query.data.items.map((item) => (
              <li key={item.id} className="cms-content-row">
                <strong>{item.user.email}</strong>
                <span>Nomor saat ini: {item.user.phone ?? "Belum diisi"}</span>
                <span>
                  Email baru: {item.newEmail ?? "Tetap"} · Nomor baru:{" "}
                  {item.newPhone ?? "Tetap"}
                </span>
                <span>
                  {new Date(item.expiresAt) <= new Date()
                    ? "Kedaluwarsa"
                    : "Menunggu verifikasi"}{" "}
                  · Batas: {new Date(item.expiresAt).toLocaleString("id-ID")}
                </span>
                <button
                  className="cms-edit-button"
                  onClick={() => setSelected(item)}
                >
                  Tinjau permintaan
                </button>
              </li>
            ))}
          </ul>
          <div className="cms-pagination">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Sebelumnya
            </button>
            <span>
              Halaman {page} · {query.data.total} permintaan
            </span>
            <button
              disabled={page * 10 >= query.data.total}
              onClick={() => setPage(page + 1)}
            >
              Berikutnya
            </button>
          </div>
        </>
      )}
    </>
  );
}
export default function ContactReviewPage() {
  return (
    <main className="min-w-0">
      <AdminPageHeader
        title="Verifikasi kontak"
        description="Tinjau perubahan email dan nomor telepon yang diajukan warga."
        icon={UserCheck}
      />
      <AdminAccess>
        <Reviews />
      </AdminAccess>
    </main>
  );
}
