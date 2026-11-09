"use client";

import { useEffect, useState } from "react";
import {
  Pencil,
  Plus,
  FolderTree,
  Search,
  RotateCw,
  X,
  Calendar,
  Layers,
  Eye,
} from "lucide-react";
import {
  NewsPaperSvg,
  GalleryPhotoSvg,
} from "@/components/admin/admin-icons";
import {
  AdminEmptyState,
  AdminLoading,
  AdminError,
} from "@/components/admin/feedback";
import { AdminAccess } from "@/features/cms/admin-access";
import { Categories } from "@/features/cms/categories";
import { MediaLibrary } from "@/features/cms/media-library";
import { cmsError, type News } from "@/features/cms/client";
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
import {
  useResponseListMaster,
  useResponseOption,
  useResponseDetailMaster,
} from "./hooks/crud";
import type { ResponseInterface } from "./types";
import { FormBeritaModal } from "./components/FormBeritaModal";
import { DetailBeritaModal } from "./components/DetailBeritaModal";

function Workspace() {
  const [tab, setTab] = useState("berita");
  const [editorEpoch, setEditorEpoch] = useState(0);
  const [selected, setSelected] = useState<News | null>(null);
  const [detailItem, setDetailItem] = useState<ResponseInterface | null>(null);
  const editorOpen = selected !== null;

  useEffect(() => {
    if (editorOpen) window.scrollTo(0, 0);
  }, [editorOpen]);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [categoryId, setCategoryId] = useState("");
  const [notice, setNotice] = useState("");

  const query = useResponseListMaster({
    page,
    search,
    status,
    sort,
    categoryId,
  });

  const categories = useResponseOption();

  const open = useResponseDetailMaster((news) => {
    setEditorEpoch((value) => value + 1);
    setSelected(news);
    setNotice("");
  });

  const confirmLeave = () =>
    !selected ||
    confirm(
      "Beralih akan menutup editor. Pastikan perubahan sudah disimpan. Lanjutkan?",
    );

  const items = query.data?.items ?? [];
  const totalItems = query.data?.total ?? 0;
  const publishedCount = items.filter((r) => r.status === "PUBLISHED").length;
  const draftCount = items.filter((r) => r.status === "DRAFT").length;

  return (
    <div className="space-y-6">
      {/* Segmented Glass Pill Tabs */}
      <nav aria-label="Kanal berita dan media" className="cms-channel-tabs">
        {[
          { id: "berita", label: "Daftar Berita", icon: NewsPaperSvg },
          { id: "kategori", label: "Kategori Berita", icon: FolderTree },
          { id: "media", label: "Pustaka Media", icon: GalleryPhotoSvg },
        ].map(({ id, label, icon: TabIcon }) => {
          const isActive = tab === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                if (confirmLeave()) {
                  setSelected(null);
                  setTab(id);
                }
              }}
            >
              <TabIcon size={17} strokeWidth={2} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {tab === "media" && <MediaLibrary />}
      {tab === "kategori" && <Categories />}
      {tab === "berita" && (
        <>
          {!selected && (
            <div className="space-y-5">
              {/* 4 Stat Cards (EduSetara Pattern) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <Card padding="sm" className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Total Berita
                    </span>
                    <span className="text-2xl font-black text-slate-900 mt-1 block">
                      {totalItems}
                    </span>
                  </div>
                  <div className="glass-icon-box size-10 rounded-xl">
                    <NewsPaperSvg size={19} />
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
                      Kategori Aktif
                    </span>
                    <span className="text-2xl font-black text-slate-900 mt-1 block">
                      {categories.data?.items.length ?? 0}
                    </span>
                  </div>
                  <div className="glass-icon-box size-10 rounded-xl">
                    <FolderTree size={18} />
                  </div>
                </Card>
              </div>

              {/* Unified Glass Toolbar & Filter Panel */}
              <div className="glass-toolbar space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-100/80 pb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Arsip & Publikasi Berita Kelurahan
                    </h2>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      Kelola kabar kegiatan, pengumuman pers, dan artikel liputan warga Kelurahan Watundehoa.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    leftIcon={<Plus size={16} strokeWidth={2.5} />}
                    onClick={() => {
                      if (confirmLeave()) {
                        setSelected({
                          id: crypto.randomUUID(),
                          slug: "",
                          title: "",
                          excerpt: "",
                          bodyHtml: "<p></p>",
                          categoryId: "",
                          coverId: null,
                          status: "DRAFT",
                          version: 0,
                        });
                        setNotice("");
                      }
                    }}
                  >
                    Buat Berita Baru
                  </Button>
                </div>

                {/* Filter Controls Grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] items-center">
                  <div className="relative sm:col-span-2 lg:col-span-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-500" />
                    <input
                      className="cms-input pl-10 pr-9 text-xs w-full"
                      placeholder="Cari judul berita atau slug..."
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
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 grid size-6 place-items-center rounded-md text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-colors"
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
                    <option value="">Semua Status</option>
                    <option value="PUBLISHED">Status: Terbit</option>
                    <option value="DRAFT">Status: Draft</option>
                    <option value="ARCHIVED">Status: Arsip</option>
                  </select>

                  <select
                    className="cms-input text-xs font-semibold"
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">Semua Kategori</option>
                    {categories.data?.items.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    className="cms-input text-xs font-semibold"
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="newest">Terbaru Diperbarui</option>
                    <option value="oldest">Terlama Diperbarui</option>
                    <option value="title">Abjad Judul A–Z</option>
                  </select>

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
                <AdminError
                  error={query.error}
                  onRetry={() => void query.refetch()}
                />
              )}

              {query.data?.items.length === 0 && (
                <AdminEmptyState
                  title="Belum ada berita yang sesuai"
                  description="Buat berita pertama untuk berbagi kabar dengan warga, atau sesuaikan filter pencarian Anda."
                />
              )}

              {query.data && query.data.items.length > 0 && (
                <Card padding="sm" className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center">No</TableHead>
                        <TableHead>Judul & Slug Artikel</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Revisi & Tanggal</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {query.data.items.map((row, idx) => {
                        const statusVariant =
                          row.status === "PUBLISHED"
                            ? "success"
                            : row.status === "DRAFT"
                              ? "warning"
                              : "neutral";
                        const statusLabel =
                          row.status === "PUBLISHED"
                            ? "Terbit"
                            : row.status === "DRAFT"
                              ? "Draft"
                              : "Arsip";
                        const formattedDate = row.updatedAt
                          ? new Date(row.updatedAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-";

                        return (
                          <TableRow key={row.id}>
                            <TableCell className="text-center font-bold text-slate-400 text-xs">
                              {listindex(10, page, idx)}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5 max-w-md">
                                <p className="font-extrabold text-slate-900 text-sm line-clamp-1">
                                  {row.title}
                                </p>
                                {row.slug && (
                                  <p className="text-[11px] font-mono text-slate-400 truncate">
                                    /berita/{row.slug}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="sky">
                                {row.category?.name || "Umum"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusVariant} dot>
                                {statusLabel}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1 text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                                  <Layers size={11} className="text-sky-600" />
                                  Revisi v{row.version}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px]">
                                  <Calendar size={11} />
                                  {formattedDate}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDetailItem(row)}
                                  leftIcon={<Eye size={13} />}
                                >
                                  Detail
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  disabled={open.isPending}
                                  aria-label={`Edit ${row.title}`}
                                  onClick={() => {
                                    if (confirmLeave()) open.mutate(row.id);
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
                    itemName="berita"
                  />
                </Card>
              )}

              {open.isError && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <p role="alert">{cmsError(open.error)}</p>
                </div>
              )}
            </div>
          )}

          {selected && (
            <FormBeritaModal
              selected={selected}
              editorEpoch={editorEpoch}
              notice={notice}
              onClose={() => {
                if (confirmLeave()) setSelected(null);
              }}
              onSaved={(news, cacheInvalidated) => {
                setEditorEpoch((value) => value + 1);
                setSelected(news);
                setNotice(
                  `Berita berhasil disimpan.${cacheInvalidated === false ? " Perubahan pada website sedang disinkronkan." : ""}`,
                );
                void query.refetch();
              }}
            />
          )}

          <DetailBeritaModal
            isOpen={detailItem !== null}
            item={detailItem}
            onClose={() => setDetailItem(null)}
            onEdit={(id) => {
              if (confirmLeave()) open.mutate(id);
            }}
          />
        </>
      )}
    </div>
  );
}

export default function BeritaPage() {
  return (
    <main className="min-w-0 space-y-6">
      <PageHeader
        title="Publikasi Berita & Media"
        description="Kelola informasi terkini, liputan kegiatan, kategori artikel, dan pustaka media website kelurahan."
        icon={NewsPaperSvg}
        badge={{ text: "Publikasi Terpadu", variant: "sky" }}
      />
      <AdminAccess>
        <Workspace />
      </AdminAccess>
    </main>
  );
}
