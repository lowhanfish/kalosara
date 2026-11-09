"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChartColumn,
  Building2,
  Sparkles,
  ArrowLeft,
  Pencil,
  Plus,
  Search,
  RotateCw,
  X,
  MapPin,
  Calendar,
} from "lucide-react";
import Editor from "./editor";
import { AdminPagination } from "@/components/admin/pagination";
import { AdminAccess } from "@/features/cms/admin-access";
import { MediaLibrary } from "@/features/cms/media-library";
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
  statistics: ChartColumn,
  facilities: Building2,
  potentials: Sparkles,
};

const moduleThemes = {
  statistics: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
  },
  facilities: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-100",
  },
  potentials: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-100",
  },
};

function statusBadge(status: string) {
  switch (status) {
    case "PUBLISHED":
      return {
        label: "Terbit",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        dot: "bg-emerald-500",
      };
    case "DRAFT":
      return {
        label: "Draft",
        badge: "bg-amber-50 text-amber-700 border-amber-200/80",
        dot: "bg-amber-500",
      };
    case "ARCHIVED":
      return {
        label: "Arsip",
        badge: "bg-slate-100 text-slate-600 border-slate-200",
        dot: "bg-slate-400",
      };
    default:
      return {
        label: status,
        badge: "bg-slate-100 text-slate-600 border-slate-200",
        dot: "bg-slate-400",
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

  const ActiveIcon = moduleIcons[kind] ?? ChartColumn;
  const currentTheme = moduleThemes[kind] ?? moduleThemes.statistics;

  return (
    <div className="space-y-6">
      {/* Module Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6">
        {(Object.entries(modules) as [Kind, string][]).map(([key, label]) => {
          const isActive = kind === key;
          const Icon = moduleIcons[key] ?? ChartColumn;
          return (
            <button
              key={key}
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
              className={`pb-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {selected === undefined && (
        <div className="space-y-6">
          {/* Top Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Daftar {modules[kind]}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
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
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-all active:scale-95 self-start sm:self-auto"
            >
              <Plus size={15} />
              <span>+ Buat {modules[kind]} Baru</span>
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative min-w-[220px] flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  className="cms-input pl-9 text-xs"
                  placeholder={
                    kind === "statistics"
                      ? "Cari sumber data / periode..."
                      : "Cari nama..."
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
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <select
                className="cms-input text-xs font-semibold py-2 px-3 pr-8 shrink-0"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua Status</option>
                <option value="PUBLISHED">Terbit</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Arsip</option>
              </select>

              {kind === "potentials" && (
                <select
                  className="cms-input text-xs font-semibold py-2 px-3 pr-8 shrink-0"
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
            </div>

            <button
              type="button"
              onClick={() => void query.refetch()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs self-start lg:self-auto"
            >
              <RotateCw
                size={13}
                className={query.isFetching ? "animate-spin text-primary" : ""}
              />
              <span>Segarkan</span>
            </button>
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
              <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden divide-y divide-slate-100">
                {query.data.items.map((item) => {
                  const badgeInfo = statusBadge(item.status);
                  const isStat = "period" in item;
                  const itemTitle = isStat
                    ? `Periode ${item.period}`
                    : item.name;

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4 hover:bg-slate-50/60 transition-colors group"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div
                          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${currentTheme.bg} ${currentTheme.text} border ${currentTheme.border} shadow-2xs`}
                        >
                          <ActiveIcon size={18} />
                        </div>

                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badgeInfo.badge}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${badgeInfo.dot} ${
                                  item.status === "PUBLISHED" ? "animate-pulse" : ""
                                }`}
                              />
                              {badgeInfo.label}
                            </span>

                            {"category" in item && item.category && (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                                {item.category}
                              </span>
                            )}

                            {"source" in item && item.source && (
                              <span className="text-xs text-slate-500">
                                Sumber: <strong className="text-slate-700">{item.source}</strong>
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-primary transition-colors break-words">
                            {itemTitle}
                          </h3>

                          {"location" in item && Boolean(item.location) && (
                            <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                              <MapPin size={12} className="shrink-0" />
                              <span>{String(item.location)}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
                          title={`Edit ${itemTitle}`}
                          aria-label={`Edit ${itemTitle}`}
                          onClick={() => {
                            if (leave()) {
                              setSelected(item);
                              setEpoch(epoch + 1);
                              setNotice("");
                            }
                          }}
                        >
                          <Pencil size={13} className="text-primary" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
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
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              onClick={() => {
                if (leave()) {
                  setSelected(undefined);
                  setNotice("");
                }
              }}
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Daftar {modules[kind]}</span>
            </button>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
              {selected
                ? `Mengedit: ${"period" in selected ? `Periode ${selected.period}` : selected.name.slice(0, 40)}`
                : `Tambah ${modules[kind]} Baru`}
            </span>
          </div>

          {notice && (
            <p
              role="status"
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800"
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
        description="Kelola data demografi kependudukan, sarana prasarana publik, dan potensi wisata kelurahan."
        icon={ChartColumn}
      />
      <AdminAccess>
        <Workspace />
      </AdminAccess>
    </main>
  );
}
