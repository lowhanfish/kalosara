"use client";
import { AdminLoading, AdminError } from "@/components/admin/feedback";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ChartColumn, ArrowLeft, Pencil } from "lucide-react";
import Editor from "./editor";
import { AdminPagination } from "@/components/admin/pagination";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminAccess } from "@/features/cms/admin-access";
import { MediaLibrary } from "@/features/cms/media-library";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import type { RegionList } from "@/lib/region";
import { modules, type Kind, type Row } from "./types";

function Workspace() {
  const runtime = useAuthRuntime();
  const auth = useAuth();
  const [kind, setKind] = useState<Kind>("statistics");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<Row | null | undefined>();
  const [epoch, setEpoch] = useState(0);
  const editorOpen = selected !== undefined;
  useEffect(() => {
    if (editorOpen) window.scrollTo(0, 0);
  }, [editorOpen]);
  useEffect(() => {
    const sync = () => {
      const key = window.location.hash.slice(1);
      if (["statistics", "facilities", "potentials"].includes(key)) {
        setKind(key as Kind);
        setCategory("");
        setPage(1);
        setSelected(undefined);
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const [notice, setNotice] = useState("");
  const query = useQuery({
    queryKey: [
      "user",
      auth.user?.id,
      "region",
      kind,
      page,
      search,
      status,
      category,
    ],
    queryFn: () =>
      runtime.request<RegionList<Row>>(
        `/admin/region/${kind}?page=${page}&search=${encodeURIComponent(search)}${status ? `&status=${status}` : ""}${kind === "potentials" && category ? `&category=${encodeURIComponent(category)}` : ""}`,
      ),
  });
  const leave = () =>
    selected === undefined ||
    confirm("Tutup editor? Pastikan perubahan sudah disimpan.");
  return (
    <>
      <div className="cms-channel-tabs">
        {Object.entries(modules).map(([key, label]) => (
          <button
            key={key}
            aria-pressed={kind === key}
            onClick={() => {
              if (leave()) {
                window.location.hash = key;
                setKind(key as Kind);
                setCategory("");
                setPage(1);
                setSelected(undefined);
                setNotice("");
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {selected === undefined && (
        <>
          <form
            className="cms-filters"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(
                String(new FormData(e.currentTarget).get("search") ?? ""),
              );
            }}
          >
            <label>
              {kind === "statistics" ? "Cari sumber data" : "Cari nama"}
              <input className="cms-input" name="search" maxLength={100} />
            </label>
            <label>
              Filter status
              <select
                className="cms-input"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Terbit</option>
                <option value="ARCHIVED">Arsip</option>
              </select>
            </label>
            {kind === "potentials" && (
              <label>
                Jenis konten
                <select
                  className="cms-input"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Semua potensi</option>
                  <option value="Wisata">Wisata</option>
                  <option value="Produk UMKM">Produk UMKM</option>
                  <option value="Potensi kelurahan">Potensi kelurahan</option>
                </select>
              </label>
            )}
            <button className="yellow-button">Cari</button>
          </form>
          <button
            className="yellow-button"
            onClick={() => {
              if (leave()) {
                setSelected(null);
                setEpoch(epoch + 1);
                setNotice("");
              }
            }}
          >
            Buat {modules[kind]}
          </button>
          {query.isPending && <AdminLoading />}
          {query.isError && (
            <AdminError
              error={query.error}
              onRetry={() => void query.refetch()}
            />
          )}
          {query.data?.items.length === 0 && (
            <p className="py-5">Belum ada data yang sesuai.</p>
          )}
          <ul className="cms-content-list">
            {query.data?.items.map((item) => (
              <li key={item.id} className="cms-content-row">
                <div className="cms-row-title">
                  <h2>
                    {"period" in item
                      ? `Periode ${item.period} · ${item.source}`
                      : item.name}
                  </h2>
                  <span className="cms-status" data-status={item.status}>
                    {
                      {
                        DRAFT: "Draft",
                        PUBLISHED: "Terbit",
                        ARCHIVED: "Arsip",
                      }[item.status]
                    }
                  </span>
                </div>
                <button
                  type="button"
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  title={`Edit ${"period" in item ? item.period : item.name}`}
                  aria-label={`Edit ${"period" in item ? item.period : item.name}`}
                  onClick={() => {
                    if (leave()) {
                      setSelected(item);
                      setEpoch(epoch + 1);
                      setNotice("");
                    }
                  }}
                >
                  <Pencil size={15} />
                </button>
              </li>
            ))}
          </ul>
          <AdminPagination
            page={page}
            total={query.data?.total ?? 0}
            limit={10}
            onPageChange={setPage}
            itemName="data"
          />
        </>
      )}
      {selected !== undefined && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            onClick={() => {
              if (leave()) setSelected(undefined);
            }}
          >
            <ArrowLeft size={16} /> Kembali ke daftar data
          </button>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {selected ? `Mengedit Data` : "Tambah Data Baru"}
          </span>
        </div>
      )}
      {notice && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[15px] text-emerald-800"
        >
          {notice}
        </p>
      )}
      {selected !== undefined && (
        <Editor
          key={`${kind}-${epoch}`}
          kind={kind}
          item={selected}
          onSaved={(item, pending) => {
            setSelected(item);
            setEpoch(epoch + 1);
            setNotice(
              `Data tersimpan. ${pending ? "Perubahan pada website sedang disinkronkan." : ""}`,
            );
            void query.refetch();
          }}
        />
      )}
      {kind !== "statistics" && (
        <details className="cms-media-drawer">
          <summary>
            Pustaka media <span>Unggah foto fasilitas dan potensi lokal</span>
          </summary>
          <div className="cms-media-content">
            <MediaLibrary />
          </div>
        </details>
      )}
    </>
  );
}
export default function Page() {
  return (
    <main id="konten" tabIndex={-1} className="min-w-0">
      <AdminPageHeader
        title="Statistik & wilayah"
        description="Perbarui data wilayah, fasilitas publik, dan potensi lokal."
        icon={ChartColumn}
      />
      <AdminAccess>
        <Workspace />
      </AdminAccess>
    </main>
  );
}
