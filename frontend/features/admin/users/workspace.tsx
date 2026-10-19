"use client";
import {
  AdminEmptyState,
  AdminLoading,
  AdminError,
} from "@/components/admin/feedback";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Users } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminAccess } from "@/features/cms/admin-access";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsError, cmsMutate, type List } from "@/features/cms/client";
type User = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  updatedAt: string;
};
type Audit = {
  id: string;
  actorId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  requestId: string | null;
  ipHash: string | null;
  createdAt: string;
};
type Upload = {
  id: string;
  originalName: string;
  size: number;
  visibility: string;
  archived: boolean;
};
type Uploads = List<Upload> & {
  quota: {
    perFileBytes: number;
    physicalBytes: number;
    concurrentUploads: number;
    totalLimitBytes: null;
  };
};
function AccessForm({ user, close }: { user: User; close: () => void }) {
  const runtime = useAuthRuntime();
  const [action, setAction] = useState("REVOKE_SESSIONS");
  const mutation = useMutation({
    mutationFn: async (body: {
      action: string;
      identityVerified: boolean;
      currentPassword: string;
      expectedUpdatedAt: string;
      newPassword?: string;
    }) => {
      try {
        return await cmsMutate(
          runtime.request,
          `/admin/dashboard/users/${user.id}/access`,
          body,
          "POST",
        );
      } finally {
        body.currentPassword = "";
        delete body.newPassword;
      }
    },
    onSuccess: async () => {
      await runtime.queryClient.invalidateQueries({ queryKey: ["user"] });
      close();
    },
  });
  return (
    <form
      className="cms-editor"
      onSubmit={(e) => {
        e.preventDefault();
        if (
          !confirm(
            `Konfirmasi ${action} untuk ${user.email}? Semua sesi akun ini akan dicabut.`,
          )
        )
          return;
        const form = e.currentTarget;
        const f = new FormData(form);
        const body = {
          action,
          identityVerified: f.get("verified") === "on",
          currentPassword: String(f.get("password")),
          expectedUpdatedAt: user.updatedAt,
          ...(action === "RESET_PASSWORD"
            ? { newPassword: String(f.get("newPassword")) }
            : {}),
        };
        form.reset();
        mutation.mutate(body);
      }}
    >
      <h2>Ubah akses: {user.email}</h2>
      <p>
        Verifikasi identitas pemilik terlebih dahulu. Perubahan mencabut semua
        sesi. Sampaikan kata sandi baru melalui saluran pribadi yang disepakati;
        sistem tidak mengirim email reset.
      </p>
      <label>
        Tindakan
        <select
          className="cms-input"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        >
          <option value="REVOKE_SESSIONS">Cabut semua sesi</option>
          <option value={user.isActive ? "DEACTIVATE" : "ACTIVATE"}>
            {user.isActive ? "Nonaktifkan akun" : "Aktifkan akun"}
          </option>
          <option value="RESET_PASSWORD">Reset kata sandi</option>
        </select>
      </label>
      <label>
        Kata sandi admin Anda
        <input
          className="cms-input"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={72}
        />
      </label>
      {action === "RESET_PASSWORD" && (
        <label>
          Kata sandi baru akun tujuan (12 karakter, maksimal 72 byte)
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
      )}
      <label>
        <input type="checkbox" name="verified" required /> Saya telah
        memverifikasi identitas dan permintaan pemilik akun.
      </label>
      <div className="cms-pagination">
        <button className="yellow-button" disabled={mutation.isPending}>
          Konfirmasi perubahan
        </button>
        <button type="button" disabled={mutation.isPending} onClick={close}>
          Batal
        </button>
      </div>
      {mutation.isPending && <p role="status">Memproses perubahan…</p>}
      {mutation.isError && (
        <p role="alert">
          {cmsError(mutation.error)} Tutup form dan muat ulang daftar sebelum
          mencoba lagi.
        </p>
      )}
    </form>
  );
}
function Management() {
  const runtime = useAuthRuntime();
  const auth = useAuth();
  const [tab, setTab] = useState<"users" | "audit" | "uploads">("users");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const query = useQuery({
    queryKey: ["user", auth.user?.id, "management", tab, page, search],
    queryFn: () =>
      runtime.request<List<User | Audit | Upload> & Partial<Uploads>>(
        `/admin/dashboard/${tab}?page=${page}&limit=10&search=${encodeURIComponent(search)}`,
      ),
    staleTime: 0,
  });
  return (
    <>
      <p>
        <Link
          href="/admin/verifikasi-kontak"
          className="cms-edit-button inline-block mb-4"
        >
          Verifikasi perubahan kontak masyarakat
        </Link>
      </p>
      <div className="cms-channel-tabs">
        {(
          [
            ["users", "Pengguna"],
            ["audit", "Audit"],
            ["uploads", "Upload"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            aria-pressed={tab === key}
            onClick={() => {
              setTab(key);
              setPage(1);
              setSearch("");
              setSelected(null);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="block">
        Cari{" "}
        {tab === "users" ? "email" : tab === "audit" ? "aksi" : "nama file"}
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
        <AccessForm
          key={selected.id}
          user={selected}
          close={() => setSelected(null)}
        />
      )}
      {query.isPending && <AdminLoading />}
      {query.isError && (
        <AdminError error={query.error} onRetry={() => void query.refetch()} />
      )}
      {query.data && (
        <>
          {query.data.quota && (
            <p>
              Batas file: {query.data.quota.perFileBytes / 1024 / 1024} MiB;
              maksimum {query.data.quota.concurrentUploads} upload bersamaan.
              Pemakaian fisik seluruh file, varian dan legacy:{" "}
              {(query.data.quota.physicalBytes / 1024 / 1024).toFixed(2)} MiB.
              Kuota total belum ditetapkan. File privat hanya dapat dilihat
              pemiliknya.
            </p>
          )}
          {tab === "users" && (
            <p>
              Perubahan role dilakukan melalui operasi backend terpisah dengan
              pemeriksaan izin dan verifikasi ulang; lihat prosedur README. Akun
              sendiri diubah oleh admin lain.
            </p>
          )}
          {query.data.items.length === 0 && (
            <AdminEmptyState
              title="Belum ada data"
              description="Tambahkan informasi baru atau ubah filter pencarian Anda."
            />
          )}
          <ul className="cms-content-list cms-management-list">
            {query.data.items.map((item) => (
              <li className="cms-content-row" key={item.id}>
                {"email" in item ? (
                  <>
                    <strong>{item.email}</strong>
                    <span>
                      {item.role} · {item.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                    <code>{item.id}</code>
                    <button
                      disabled={item.id === auth.user?.id}
                      onClick={() => setSelected(item)}
                    >
                      Kelola akses
                    </button>
                  </>
                ) : "action" in item ? (
                  <>
                    <strong>{item.action}</strong>
                    <time dateTime={item.createdAt}>
                      {new Date(item.createdAt).toLocaleString("id-ID")}
                    </time>
                    <span>
                      Pelaku: {item.actorId ?? "Sistem"} · {item.resourceType}{" "}
                      {item.resourceId}
                    </span>
                    <span>
                      Request:{" "}
                      {item.requestId ?? "Tidak tersedia (log lama/CLI)"}
                    </span>
                    <span>
                      IP pseudonim harian: {item.ipHash ?? "Tidak tersedia"}
                    </span>
                  </>
                ) : (
                  <>
                    <strong>{item.originalName}</strong>
                    <span>
                      {(item.size / 1024 / 1024).toFixed(2)} MiB ·{" "}
                      {item.visibility} · {item.archived ? "Arsip" : "Aktif"}
                    </span>
                    <code>{item.id}</code>
                  </>
                )}
              </li>
            ))}
          </ul>
          <div className="cms-pagination">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Sebelumnya
            </button>
            <span>
              Halaman {page} · {query.data.total} data
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
export default function UsersPage() {
  return (
    <main className="min-w-0">
      <AdminPageHeader
        title="Pengguna & audit"
        description="Kelola akses pengguna dan tinjau aktivitas pengelolaan."
        icon={Users}
      />
      <AdminAccess>
        <Management />
      </AdminAccess>
    </main>
  );
}
