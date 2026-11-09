"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Search,
  RotateCw,
  X,
  MapPin,
  Users,
} from "lucide-react";
import {
  ChartBarSvg,
  MapPinBuildingSvg,
  SparkleGemSvg,
} from "@/components/admin/admin-icons";
import Editor from "./editor";
import { AdminPagination } from "@/components/admin/pagination";
import { AdminAccess } from "@/features/cms/admin-access";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import {
  AdminEmptyState,
  AdminLoading,
  AdminError,
} from "@/components/admin/feedback";
import { AdminPageHeader } from "@/components/admin/page-header";
import type { RegionList } from "@/lib/region";
import { modules, type Kind, type Row } from "./types";

const moduleIcons = {
  statistics: ChartBarSvg,
  facilities: MapPinBuildingSvg,
  potentials: SparkleGemSvg,
};

function statusBadge(status: string) {
  switch (status) {
    case "PUBLISHED":
      return {
        label: "Terbit",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200/90",
        dot: "bg-emerald-500",
        accent: "from-emerald-500 to-teal-500",
      };
    case "DRAFT":
      return {
        label: "Draft",
        badge: "bg-amber-50 text-amber-700 border-amber-200/90",
        dot: "bg-amber-500",
        accent: "from-amber-400 to-orange-500",
      };
    case "ARCHIVED":
      return {
        label: "Arsip",
        badge: "bg-slate-100 text-slate-600 border-slate-200",
        dot: "bg-slate-400",
        accent: "from-slate-400 to-slate-500",
      };
    default:
      return {
        label: status,
        badge: "bg-slate-100 text-slate-600 border-slate-200",
        dot: "bg-slate-400",
        accent: "from-blue-500 to-indigo-600",
      };
  }
}

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
  const [notice, setNotice] = useState("");

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

  const ActiveIcon = moduleIcons[kind] ?? ChartBarSvg;

  return (
    <div className="space-y-6">
      {/* Segmented Glass Pill Tabs */}
      <nav aria-label="Modul wilayah" className="cms-channel-tabs">
        {(Object.entries(modules) as [Kind, string][]).map(([key, label]) => {
          const isActive = kind === key;
          const Icon = moduleIcons[key] ?? ChartBarSvg;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                if (leave()) {
                  window.location.hash = key;
                  setKind(key);
                  setCategory("");
                  setPage(1);
                  setSelected(undefined);
                  setNotice("");
                }
              }}
            >
              <Icon size={17} strokeWidth={2} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {selected === undefined && (
        <div className="space-y-5">
          {/* Unified Glass Toolbar */}
          <div className="glass-toolbar space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-100/80 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Daftar {modules[kind]}
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Kelola data {modules[kind].toLowerCase()} untuk ditampilkan pada profil dan peta publik kelurahan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (leave()) {
                    setSelected(null);
                    setEpoch(epoch + 1);
                    setNotice("");
                  }
                }}
                className="glass-button-primary shrink-0 self-start sm:self-auto"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Tambah {modules[kind]}</span>
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_auto_auto] items-center">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                <input
                  className="cms-input pl-10 pr-9 text-xs"
                  placeholder={
                    kind === "statistics"
                      ? "Cari sumber data atau periode..."
                      : "Cari nama fasilitas atau potensi..."
                  }
                  value={search}
                  maxLength={100}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 grid size-6 place-items-center rounded-md text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <select
                className="cms-input text-xs font-semibold"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua Status Publikasi</option>
                <option value="PUBLISHED">Status: Terbit</option>
                <option value="DRAFT">Status: Draft</option>
                <option value="ARCHIVED">Status: Arsip</option>
              </select>

              {kind === "potentials" && (
                <select
                  className="cms-input text-xs font-semibold"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Semua Kategori Potensi</option>
                  <option value="Wisata">Wisata</option>
                  <option value="Produk UMKM">Produk UMKM</option>
                  <option value="Potensi kelurahan">Potensi Kelurahan</option>
                </select>
              )}

              <button
                type="button"
                onClick={() => void query.refetch()}
                className="glass-button-secondary"
              >
                <RotateCw
                  size={14}
                  strokeWidth={2.2}
                  className={query.isFetching ? "animate-spin text-blue-600" : ""}
                />
                <span>Segarkan</span>
              </button>
            </div>
          </div>

          {query.isPending && <AdminLoading />}
          {query.isError && (
            <AdminError error={query.error} onRetry={() => void query.refetch()} />
          )}

          {query.data?.items.length === 0 && (
            <AdminEmptyState
              title={`Belum ada data ${modules[kind].toLowerCase()}`}
              description="Tambahkan data baru atau ubah kriteria filter pencarian Anda."
            />
          )}

          {query.data && query.data.items.length > 0 && (
            <div className="space-y-4">
              <div className="grid gap-3.5">
                {query.data.items.map((item) => {
                  const badgeInfo = statusBadge(item.status);
                  const isStat = "period" in item;
                  const itemTitle = isStat
                    ? `Statistik Periode ${item.period}`
                    : item.name;

                  return (
                    <article
                      key={item.id}
                      className="glass-list-card group flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden"
                    >
                      <span
                        className={`pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${badgeInfo.accent}`}
                      />
                      <div className="flex items-start gap-4 min-w-0 pl-1">
                        <div className="glass-icon-box size-12">
                          <ActiveIcon size={22} strokeWidth={2} />
                        </div>

                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badgeInfo.badge}`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${badgeInfo.dot} ${
                                  item.status === "PUBLISHED" ? "animate-pulse" : ""
                                }`}
                              />
                              {badgeInfo.label}
                            </span>

                            {"category" in item && item.category && (
                              <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                                {item.category}
                              </span>
                            )}

                            {"source" in item && item.source && (
                              <span className="text-xs font-medium text-slate-500">
                                Sumber:{" "}
                                <strong className="text-slate-800">
                                  {item.source}
                                </strong>
                              </span>
                            )}
                          </div>

                          <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-700 transition-colors break-words">
                            {itemTitle}
                          </h3>

                          {isStat && (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {item.population !== null && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50/80 border border-blue-200/70 px-2.5 py-1 text-xs font-bold text-blue-800">
                                  <Users size={12} className="text-blue-600" />
                                  {item.population.toLocaleString("id-ID")} Jiwa
                                </span>
                              )}
                              {item.households !== null && (
                                <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                  {item.households.toLocaleString("id-ID")} KK
                                </span>
                              )}
                            </div>
                          )}

                          {"location" in item && Boolean(item.location) && (
                            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 truncate">
                              <MapPin size={13} className="shrink-0 text-blue-600" />
                              <span>{String(item.location)}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          className="glass-button-secondary"
                          title={`Sunting ${itemTitle}`}
                          aria-label={`Edit ${itemTitle}`}
                          onClick={() => {
                            if (leave()) {
                              setSelected(item);
                              setEpoch(epoch + 1);
                              setNotice("");
                            }
                          }}
                        >
                          <Pencil size={14} strokeWidth={2.2} />
                          <span>Sunting</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <AdminPagination
                page={page}
                total={query.data.total ?? 0}
                limit={10}
                onPageChange={setPage}
                itemName="data wilayah"
              />
            </div>
          )}
        </div>
      )}

      {selected !== undefined && (
        <div className="space-y-4">
          <div className="glass-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900 transition-colors"
              onClick={() => {
                if (leave()) {
                  setSelected(undefined);
                  setNotice("");
                }
              }}
            >
              <ArrowLeft size={17} strokeWidth={2.2} />
              <span>Kembali ke Daftar {modules[kind]}</span>
            </button>
            <span className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200/80 px-3.5 py-1.5 rounded-xl w-fit">
              {selected
                ? `Menyunting: ${"period" in selected ? `Periode ${selected.period}` : selected.name.slice(0, 40)}`
                : `Tambah ${modules[kind]} Baru`}
            </span>
          </div>

          {notice && (
            <p
              role="status"
              className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs font-bold text-emerald-800"
            >
              {notice}
            </p>
          )}

          <Editor
            key={`${kind}-${epoch}`}
            kind={kind}
            item={selected}
            onSaved={(row) => {
              setSelected(row);
              setNotice("Data wilayah berhasil disimpan.");
              void query.refetch();
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <main className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Statistik & Potensi Wilayah"
        description="Kelola data demografi kependudukan, sarana prasarana fasilitas publik, dan potensi wisata kelurahan."
        icon={ChartBarSvg}
      />
      <AdminAccess>
        <Workspace />
      </AdminAccess>
    </main>
  );
}
