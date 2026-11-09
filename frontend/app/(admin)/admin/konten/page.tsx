"use client";

import { useEffect, useState } from "react";
import {
  Pencil,
  Plus,
  Search,
  RotateCw,
  X,
  Pin,
  MapPin,
  Clock,
  FolderOpen,
  Eye,
} from "lucide-react";
import {
  MegaphoneSvg,
  CalendarEventSvg,
  GalleryPhotoSvg,
  DocumentSealSvg,
} from "@/components/admin/admin-icons";
import { AdminAccess } from "@/features/cms/admin-access";
import { MediaLibrary } from "@/features/cms/media-library";
import {
  AdminEmptyState,
  AdminLoading,
  AdminError,
} from "@/components/admin/feedback";
import { channels, type ContentKind, type ContentItem } from "@/lib/content";
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
import { useResponseListMaster } from "./hooks/crud";
import { FormKontenModal } from "./components/FormKontenModal";
import { DetailKontenModal } from "./components/DetailKontenModal";

const channelIcons = {
  announcements: MegaphoneSvg,
  events: CalendarEventSvg,
  galleries: GalleryPhotoSvg,
  documents: DocumentSealSvg,
};

function Workspace() {
  const [kind, setKind] = useState<ContentKind>("announcements");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<ContentItem | null | undefined>();
  const [detailItem, setDetailItem] = useState<ContentItem | null>(null);
  const [epoch, setEpoch] = useState(0);

  const editorOpen = selected !== undefined;
  useEffect(() => {
    if (editorOpen) window.scrollTo(0, 0);
  }, [editorOpen]);

  useEffect(() => {
    const sync = () => {
      const key = window.location.hash.slice(1);
      if (["announcements", "events", "galleries", "documents"].includes(key)) {
        setKind(key as ContentKind);
        setPage(1);
        setSelected(undefined);
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const query = useResponseListMaster({ kind, page, search, status });

  const leave = () =>
    selected === undefined ||
    confirm("Tutup editor? Pastikan perubahan sudah disimpan.");

  const ActiveIcon = channelIcons[kind] ?? MegaphoneSvg;
  const items = query.data?.items ?? [];
  const totalItems = query.data?.total ?? 0;
  const publishedCount = items.filter((r) => r.status === "PUBLISHED").length;
  const draftCount = items.filter((r) => r.status === "DRAFT").length;

  return (
    <div className="space-y-6">
      {/* Segmented Glass Pill Tabs */}
      <nav aria-label="Kanal konten" className="cms-channel-tabs">
        {(Object.entries(channels) as [ContentKind, { title: string }][]).map(
          ([key, c]) => {
            const isActive = kind === key;
            const TabIcon = channelIcons[key] ?? MegaphoneSvg;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  if (leave()) {
                    window.location.hash = key;
                    setKind(key);
                    setPage(1);
                    setSelected(undefined);
                  }
                }}
              >
                <TabIcon size={17} strokeWidth={2} />
                <span>{c.title}</span>
              </button>
            );
          },
        )}
      </nav>

      {selected === undefined && (
        <div className="space-y-5">
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Card padding="sm" className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total {channels[kind].title}
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
                  Kanal Aktif
                </span>
                <span className="text-base font-extrabold text-slate-900 mt-1 block truncate">
                  {channels[kind].title}
                </span>
              </div>
              <Badge variant="sky">4 Kanal</Badge>
            </Card>
          </div>

          {/* Unified Glass Toolbar & Filter Panel */}
          <div className="glass-toolbar space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-100/80 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Daftar {channels[kind].title}
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Kelola publikasi {channels[kind].title.toLowerCase()} untuk ditampilkan pada portal website kelurahan.
                </p>
              </div>
              <Button
                variant="primary"
                leftIcon={<Plus size={16} strokeWidth={2.5} />}
                onClick={() => {
                  if (leave()) {
                    setSelected(null);
                    setEpoch(epoch + 1);
                  }
                }}
              >
                Tambah {channels[kind].title}
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr_auto] items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-500" />
                <input
                  className="cms-input pl-10 pr-9 text-xs w-full"
                  placeholder={`Cari judul ${channels[kind].title.toLowerCase()}...`}
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
              title={`Belum ada ${channels[kind].title.toLowerCase()}`}
              description="Mulai dengan menambahkan data baru, atau sesuaikan filter pencarian Anda."
            />
          )}

          {query.data && query.data.items.length > 0 && (
            <Card padding="sm" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead>Judul {channels[kind].title}</TableHead>
                    <TableHead>Atribut / Metadata</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Diperbarui</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.items.map((item, idx) => {
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
                    const formattedDate = item.updatedAt
                      ? new Date(item.updatedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "-";

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-center font-bold text-slate-400 text-xs">
                          {listindex(10, page, idx)}
                        </TableCell>
                        <TableCell>
                          <span className="font-extrabold text-slate-900 text-sm line-clamp-1">
                            {item.title}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {item.announcement?.pinned && (
                              <Badge variant="warning" size="sm">
                                <Pin size={10} /> Disematkan
                              </Badge>
                            )}
                            {item.document?.category && (
                              <Badge variant="sky" size="sm">
                                {item.document.category}
                              </Badge>
                            )}
                            {item.gallery?.photos && (
                              <Badge variant="info" size="sm">
                                {item.gallery.photos.length} Foto
                              </Badge>
                            )}
                            {item.event?.location && (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                                <MapPin size={12} className="text-sky-600" />
                                {item.event.location}
                              </span>
                            )}
                            {item.event?.start && (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                <Clock size={12} />
                                {item.event.start.slice(0, 10)}
                              </span>
                            )}
                            {!item.announcement?.pinned &&
                              !item.document?.category &&
                              !item.gallery?.photos &&
                              !item.event && (
                                <span className="text-xs text-slate-400">
                                  Standar
                                </span>
                              )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant} dot>
                            {statusLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {formattedDate}
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
                              aria-label={`Edit ${item.title}`}
                              onClick={() => {
                                if (leave()) {
                                  setSelected(item);
                                  setEpoch(epoch + 1);
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
                itemName="konten"
              />
            </Card>
          )}
        </div>
      )}

      {selected !== undefined && (
        <FormKontenModal
          kind={kind}
          epoch={epoch}
          selected={selected}
          onClose={() => {
            if (leave()) setSelected(undefined);
          }}
          onSaved={(item) => {
            setSelected(item);
            void query.refetch();
          }}
        />
      )}

      <DetailKontenModal
        isOpen={detailItem !== null}
        kind={kind}
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onEdit={(item) => {
          if (leave()) {
            setSelected(item);
            setEpoch(epoch + 1);
          }
        }}
      />

      {/* Media Library Drawer */}
      <details className="cms-media-drawer overflow-hidden">
        <summary className="cursor-pointer flex items-center justify-between hover:bg-sky-50/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="glass-icon-box size-9">
              <FolderOpen size={17} strokeWidth={2} />
            </div>
            <div>
              <strong className="text-sm font-extrabold text-slate-900 block">
                Pustaka Media & Lampiran Berkas
              </strong>
              <span className="text-xs text-slate-500">
                Klik untuk membuka panel unggah gambar atau berkas PDF
              </span>
            </div>
          </div>
        </summary>
        <div className="cms-media-content">
          <MediaLibrary />
        </div>
      </details>
    </div>
  );
}

export default function KontenPage() {
  return (
    <main id="konten" tabIndex={-1} className="min-w-0 space-y-6">
      <PageHeader
        title="Kanal Konten & Informasi"
        description="Kelola pengumuman warga, agenda kegiatan, album galeri dokumentasi, dan dokumen informasi publik (PPID)."
        icon={MegaphoneSvg}
        badge={{ text: "4 Kanal Publikasi", variant: "sky" }}
      />
      <AdminAccess>
        <Workspace />
      </AdminAccess>
    </main>
  );
}
