"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsMutate, cmsError, type List } from "@/features/cms/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminLoading, AdminError } from "@/components/admin/feedback";
import { AdminPagination } from "@/components/admin/pagination";
import { requestLabels, type CitizenRequest } from "@/lib/community";
function RequestDetail({
  item,
  onSaved,
}: {
  item: CitizenRequest;
  onSaved: () => void;
}) {
  const runtime = useAuthRuntime();
  const [status, setStatus] = useState(item.status);
  const [note, setNote] = useState(item.internalNote);
  const [version, setVersion] = useState(item.version);
  const [notice, setNotice] = useState("");
  const save = useMutation({
    mutationFn: () =>
      cmsMutate<{ version: number }>(
        runtime.request,
        `/admin/community/requests/${item.id}`,
        { status, internalNote: note, expectedVersion: version },
        "PATCH",
      ),
    onSuccess: (r) => {
      setVersion(r.version);
      setNotice("Tindak lanjut tersimpan.");
      onSaved();
    },
  });
  return (
    <section className="cms-editor">
      <h2>{item.subject}</h2>
      <p className="break-all text-xs">Referensi: {item.id}</p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted">Pengirim</dt>
          <dd>{item.name}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Instansi</dt>
          <dd>{item.organization || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Email</dt>
          <dd className="break-all">{item.email || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Telepon / WA</dt>
          <dd>{item.phone || "—"}</dd>
        </div>
      </dl>
      <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-5">
        {item.message}
      </p>
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setNotice("");
          save.mutate();
        }}
      >
        <label>
          Status tindak lanjut
          <select
            className="cms-input"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as CitizenRequest["status"])
            }
          >
            {Object.entries(requestLabels).map(([key, label]) => (
              <option value={key} key={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Catatan internal
          <textarea
            className="cms-input"
            value={note}
            maxLength={5000}
            rows={5}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <p className="text-xs text-muted">
          Catatan hanya dibaca petugas. Hubungi pengirim melalui kontak di atas;
          tidak ada pengiriman pesan otomatis.
        </p>
        <button
          disabled={save.isPending}
          className="yellow-button justify-self-start"
        >
          Simpan tindak lanjut
        </button>
        {notice && <p role="status">{notice}</p>}
        {save.isError && (
          <p role="alert">
            {cmsError(save.error)} Muat ulang detail jika data sudah berubah.
          </p>
        )}
      </form>
    </section>
  );
}
export default function InboxWorkspace() {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const [page, setPage] = useState(1);
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState("");
  const query = useQuery({
    queryKey: ["user", auth.user?.id, "community-inbox", page, kind, status],
    enabled: auth.user?.role === "ADMIN_KELURAHAN",
    queryFn: () =>
      runtime.request<List<CitizenRequest>>(
        `/admin/community/requests?${new URLSearchParams({ page: String(page), ...(kind ? { kind } : {}), ...(status ? { status } : {}) })}`,
      ),
  });
  const detail = useQuery({
    queryKey: ["user", auth.user?.id, "community-request", selected],
    enabled: !!selected && auth.user?.role === "ADMIN_KELURAHAN",
    queryFn: () =>
      runtime.request<{ item: CitizenRequest }>(
        `/admin/community/requests/${selected}`,
      ),
  });
  return (
    <main id="konten">
      <AdminPageHeader
        title="Kotak masuk masyarakat"
        description="Tinjau pengaduan dan permohonan informasi PPID. Identitas dan pesan tidak ditampilkan pada website publik."
        icon={Inbox}
      />
      {auth.user?.role !== "ADMIN_KELURAHAN" ? (
        <p role="alert">Bagian ini khusus administrator.</p>
      ) : (
        <>
          <div className="cms-filters">
            <label>
              Jenis pesan
              <select
                className="cms-input"
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua jenis</option>
                <option value="COMPLAINT">Pengaduan</option>
                <option value="INFORMATION">Permohonan PPID</option>
              </select>
            </label>
            <label>
              Status
              <select
                className="cms-input"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua status</option>
                {Object.entries(requestLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {query.isPending && <AdminLoading />}
          {query.isError && <AdminError error={query.error} />}
          <ul className="cms-content-list">
            {query.data?.items.map((item) => (
              <li className="cms-content-row" key={item.id}>
                <div className="cms-row-title">
                  <h2>{item.subject}</h2>
                  <p className="text-xs text-muted">
                    {item.kind === "COMPLAINT"
                      ? "Pengaduan"
                      : "Permohonan PPID"}{" "}
                    · {requestLabels[item.status]} ·{" "}
                    {new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                      timeZone: "Asia/Makassar",
                    }).format(new Date(item.createdAt))}
                  </p>
                </div>
                <button
                  className="cms-edit-button"
                  onClick={() => setSelected(item.id)}
                >
                  Buka pesan
                </button>
              </li>
            ))}
          </ul>
          {query.data?.items.length === 0 && (
            <p className="rounded-xl border border-slate-200 bg-white p-8 text-muted">
              Belum ada pesan sesuai filter.
            </p>
          )}
          <AdminPagination
            page={page}
            total={query.data?.total ?? 0}
            limit={10}
            onPageChange={setPage}
            itemName="pesan"
          />
          {selected && (
            <>
              <button
                className="cms-edit-button"
                onClick={() => setSelected("")}
              >
                Tutup detail
              </button>
              {detail.isPending && <AdminLoading />}
              {detail.isError && <AdminError error={detail.error} />}{" "}
              {detail.data && (
                <RequestDetail
                  key={`${selected}-${detail.data.item.version}`}
                  item={detail.data.item}
                  onSaved={() => void query.refetch()}
                />
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
