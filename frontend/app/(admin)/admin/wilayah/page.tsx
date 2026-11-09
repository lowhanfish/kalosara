"use client";

import { useEffect, useState } from "react";
import {
  Pencil,
  Plus,
  Search,
  RotateCw,
  X,
  MapPin,
  Users,
  Eye,
} from "lucide-react";
import {
  ChartBarSvg,
  MapPinBuildingSvg,
  SparkleGemSvg,
} from "@/components/admin/admin-icons";
import { AdminAccess } from "@/features/cms/admin-access";
import {
  AdminEmptyState,
  AdminLoading,
  AdminError,
} from "@/components/admin/feedback";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Pagination,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/app/(admin)/_components/ui";
import { listindex } from "@/utilities/pagination";
import { modules, type Kind, type Row } from "./types";
import { useResponseListMaster } from "./hooks/crud";
import { FormWilayahModal } from "./components/FormWilayahModal";
import { DetailWilayahModal } from "./components/DetailWilayahModal";

const moduleIcons = {
  statistics: ChartBarSvg,
  facilities: MapPinBuildingSvg,
  potentials: SparkleGemSvg,
};

function Workspace() {
  const [kind, setKind] = useState<Kind>("statistics");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<Row | null | undefined>();
  const [detailItem, setDetailItem] = useState<Row | null>(null);
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

  const query = useResponseListMaster({
    kind,
    page,
    search,
    status,
    category,
  });

  const leave = () =>
    selected === undefined ||
    confirm("Tutup editor? Pastikan perubahan sudah disimpan.");

  const ActiveIcon = moduleIcons[kind] ?? ChartBarSvg;
  const items = query.data?.items ?? [];
  const totalItems = query.data?.total ?? 0;
  const publishedCount = items.filter((r) => r.status === "PUBLISHED").length;
  const draftCount = items.filter((r) => r.status === "DRAFT").length;

  return (
    <div className="space-y-6">
      {/* Segmented Glass Pill Tabs */}
      <nav aria-label="Modul wilayah" className="cms-channel-tabs">
        {(Object.entries(modules) as [Kind, string][]).map(([key, label]) => {
          const isActive = kind === key;
          const TabIcon = moduleIcons[key] ?? ChartBarSvg;
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
              <TabIcon size={17} strokeWidth={2} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {selected === undefined && (
        <div className="space-y-5">
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Card padding="sm" className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total {modules[kind]}
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {totalItems}
                </span>
              </div>
              <div className="glass-icon-box size-10 rounded-xl">
                <ActiveIcon size={19} />
              </div>
            </Card>

            <Card padding="sm" className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">
                  Terbit Halaman Ini
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {publishedCount}
                </span>
              </div>
              <Badge variant="success" dot>
                Tayang
              </Badge>
            </Card>

            <Card padding="sm" className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">
                  Draft Halaman Ini
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {draftCount}
                </span>
              </div>
              <Badge variant="warning" dot>
                Draft
              </Badge>
            </Card>

            <Card padding="sm" className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 block">
                  Modul Aktif
                </span>
                <span className="text-base font-extrabold text-slate-900 mt-1 block truncate">
                  {modules[kind]}
                </span>
              </div>
              <Badge variant="sky">Wilayah</Badge>
            </Card>
          </div>

          {/* Unified Glass Toolbar */}
          <div className="glass-toolbar space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-100/80 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Daftar {modules[kind]}
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Kelola data {modules[kind].toLowerCase()} untuk ditampilkan pada profil dan peta publik kelurahan.
                </p>
              </div>
              <Button
                variant="primary"
                leftIcon={<Plus size={16} strokeWidth={2.5} />}
                onClick={() => {
                  if (leave()) {
                    setSelected(null);
                    setEpoch(epoch + 1);
                    setNotice("");
                  }
                }}
              >
                Tambah {modules[kind]}
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_auto_auto] items-center">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-500" />
                <input
                  className="cms-input pl-10 pr-9 text-xs w-full"
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
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 grid size-6 place-items-center rounded-md text-slate-400 hover:text-sky-600 transition-colors"
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

              <Button
                variant="secondary"
                onClick={() => void query.refetch()}
                leftIcon={
                  <RotateCw
                    size={14}
                    strokeWidth={2.2}
                    className={query.isFetching ? "animate-spin text-sky-600" : ""}
                  />
                }
              >
                Segarkan
              </Button>
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
            <Card padding="sm" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead>Nama / Periode Data</TableHead>
                    <TableHead>Rincian & Indikator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.items.map((item, idx) => {
                    const isStat = "period" in item;
                    const itemTitle = isStat
                      ? `Statistik Periode ${item.period}`
                      : item.name;
                    const statusVariant =
                      item.status === "PUBLISHED"
                        ? "success"
                        : item.status === "DRAFT"
                          ? "warning"
                          : "neutral";
                    const statusLabel =
                      item.status === "PUBLISHED"
                        ? "Terbit"
                        : item.status === "DRAFT"
                          ? "Draft"
                          : "Arsip";

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-center font-bold text-slate-400 text-xs">
                          {listindex(10, page, idx)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-slate-900 text-sm block">
                              {itemTitle}
                            </span>
                            {"source" in item && item.source && (
                              <span className="text-xs text-slate-500">
                                Sumber: {item.source}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            {isStat && item.population !== null && (
                              <Badge variant="sky">
                                <Users size={11} />
                                {item.population.toLocaleString("id-ID")} Jiwa
                              </Badge>
                            )}
                            {isStat && item.households !== null && (
                              <Badge variant="neutral">
                                {item.households.toLocaleString("id-ID")} KK
                              </Badge>
                            )}
                            {"category" in item && item.category && (
                              <Badge variant="info">{item.category}</Badge>
                            )}
                            {"location" in item && Boolean(item.location) && (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                                <MapPin size={12} className="text-sky-600" />
                                {String(item.location)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant} dot>
                            {statusLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDetailItem(item)}
                              leftIcon={<Eye size={13} />}
                            >
                              Detail
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              aria-label={`Edit ${itemTitle}`}
                              onClick={() => {
                                if (leave()) {
                                  setSelected(item);
                                  setEpoch(epoch + 1);
                                  setNotice("");
                                }
                              }}
                              leftIcon={<Pencil size={13} />}
                            >
                              Sunting
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <Pagination
                currentPage={page}
                totalPages={Math.ceil((query.data.total ?? 0) / 10)}
                totalItems={query.data.total ?? 0}
                pageSize={10}
                onPageChange={setPage}
                itemName="data wilayah"
              />
            </Card>
          )}
        </div>
      )}

      {selected !== undefined && (
        <FormWilayahModal
          kind={kind}
          epoch={epoch}
          selected={selected}
          notice={notice}
          onClose={() => {
            if (leave()) {
              setSelected(undefined);
              setNotice("");
            }
          }}
          onSaved={(row) => {
            setSelected(row);
            setNotice("Data wilayah berhasil disimpan.");
            void query.refetch();
          }}
        />
      )}

      <DetailWilayahModal
        isOpen={detailItem !== null}
        kind={kind}
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onEdit={(item) => {
          if (leave()) {
            setSelected(item);
            setEpoch(epoch + 1);
            setNotice("");
          }
        }}
      />
    </div>
  );
}

export default function WilayahPage() {
  return (
    <main className="min-w-0 space-y-6">
      <PageHeader
        title="Statistik & Potensi Wilayah"
        description="Kelola data demografi kependudukan, sarana prasarana fasilitas publik, dan potensi wisata kelurahan."
        icon={ChartBarSvg}
        badge={{ text: "Data Demografi & Sarpras", variant: "sky" }}
      />
      <AdminAccess>
        <Workspace />
      </AdminAccess>
    </main>
  );
}
