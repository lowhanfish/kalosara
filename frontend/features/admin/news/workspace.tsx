"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Newspaper,
  ArrowLeft,
  Pencil,
  Plus,
  FolderTree,
  ImageIcon,
  Search,
  RotateCw,
  X,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  AdminEmptyState,
  AdminLoading,
  AdminError,
} from "@/components/admin/feedback";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/pagination";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { AdminAccess } from "@/features/cms/admin-access";
import { Categories } from "@/features/cms/categories";
import { MediaLibrary } from "@/features/cms/media-library";
import { NewsEditor } from "@/features/cms/news-editor";
import {
  cmsError,
  type News,
  type List,
  type Category,
} from "@/features/cms/client";

type Row = Pick<News, "id" | "title" | "slug" | "status" | "version"> & {
  category: { name: string };
  updatedAt?: string;
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
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const [tab, setTab] = useState("berita");
  const [editorEpoch, setEditorEpoch] = useState(0);
  const [selected, setSelected] = useState<News | null>(null);
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

  const query = useQuery({
    queryKey: [
      "user",
      auth.user?.id,
      "cms-news",
      page,
      search,
      status,
      sort,
      categoryId,
    ],
    queryFn: () =>
      runtime.request<List<Row>>(
        `/admin/news?page=${page}&search=${encodeURIComponent(search)}&sort=${sort}${status ? `&status=${status}` : ""}${categoryId ? `&categoryId=${categoryId}` : ""}`,
      ),
  });

  const categories = useQuery({
    queryKey: ["user", auth.user?.id, "cms-categories", "filter"],
    queryFn: () =>
      runtime.request<List<Category>>("/admin/news/categories?limit=50"),
  });

  const open = useMutation({
    mutationFn: (id: string) =>
      runtime.request<{ news: News }>(`/admin/news/${id}`),
    onSuccess: (data) => {
      setEditorEpoch((value) => value + 1);
      setSelected(data.news);
      setNotice("");
    },
  });

  const confirmLeave = () =>
    !selected ||
    confirm(
      "Beralih akan menutup editor. Pastikan perubahan sudah disimpan. Lanjutkan?",
    );

  return (
    <div className="space-y-6">
      {/* Channel Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6">
        {[
          { id: "berita", label: "Daftar Berita", icon: Newspaper },
          { id: "kategori", label: "Kategori Berita", icon: FolderTree },
          { id: "media", label: "Pustaka Media", icon: ImageIcon },
        ].map(({ id, label, icon: Icon }) => {
          const isActive = tab === id;
          return (
            <button
              key={id}
              aria-pressed={isActive}
              onClick={() => {
                if (confirmLeave()) {
                  setSelected(null);
                  setTab(id);
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

      {tab === "media" && <MediaLibrary />}
      {tab === "kategori" && <Categories />}
      {tab === "berita" && (
        <>
          {!selected && (
            <div className="space-y-6">
              {/* Action Toolbar Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Kelola Berita Kelurahan
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Buat dan publikasikan artikel kabar desa/kelurahan, siaran pers, dan dokumentasi kegiatan warga.
                  </p>
                </div>
                <button
                  type="button"
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
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-all active:scale-95 self-start sm:self-auto"
                >
                  <Plus size={15} />
                  <span>+ Buat Berita Baru</span>
                </button>
              </div>

              {/* Filter Controls Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1">
                  <div className="relative min-w-[220px] flex-1 max-w-sm">
                    <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      className="cms-input pl-9 text-xs"
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
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <select
                    className="cms-input text-xs font-semibold py-2 px-3 pr-8"
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

                  <select
                    className="cms-input text-xs font-semibold py-2 px-3 pr-8"
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
                    className="cms-input text-xs font-semibold py-2 px-3 pr-8"
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="newest">Terbaru diperbarui</option>
                    <option value="oldest">Terlama diperbarui</option>
                    <option value="title">Judul A–Z</option>
                  </select>
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
                <AdminError
                  error={query.error}
                  onRetry={() => void query.refetch()}
                />
              )}

              {query.data?.items.length === 0 && (
                <AdminEmptyState
                  title="Belum ada berita"
                  description="Buat berita pertama untuk berbagi kabar dengan warga, atau sesuaikan filter pencarian Anda."
                />
              )}

              {query.data && query.data.items.length > 0 && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden divide-y divide-slate-100">
                    {query.data.items.map((row) => {
                      const badgeInfo = statusBadge(row.status);
                      const formattedDate = row.updatedAt
                        ? new Date(row.updatedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : null;

                      return (
                        <div
                          key={row.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4 hover:bg-slate-50/60 transition-colors group"
                        >
                          <div className="flex items-start gap-3.5 min-w-0">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/80 shadow-2xs">
                              <Newspaper size={18} />
                            </div>

                            <div className="min-w-0 space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                                  {row.category?.name || "Umum"}
                                </span>

                                <span
                                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badgeInfo.badge}`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${badgeInfo.dot} ${
                                      row.status === "PUBLISHED"
                                        ? "animate-pulse"
                                        : ""
                                    }`}
                                  />
                                  {badgeInfo.label}
                                </span>

                                <span className="text-xs text-slate-400">·</span>
                                <span className="text-[11px] text-slate-400">
                                  Versi {row.version}
                                </span>

                                {formattedDate && (
                                  <>
                                    <span className="text-xs text-slate-400">·</span>
                                    <span className="text-[11px] text-slate-400">
                                      Diperbarui: {formattedDate}
                                    </span>
                                  </>
                                )}
                              </div>

                              <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-primary transition-colors break-words">
                                {row.title}
                              </h3>

                              {row.slug && (
                                <p className="text-xs text-slate-400 font-mono">
                                  /{row.slug}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
                              title="Edit Berita"
                              aria-label={`Edit ${row.title}`}
                              disabled={open.isPending}
                              onClick={() => {
                                if (confirmLeave()) open.mutate(row.id);
                              }}
                            >
                              <Pencil size={13} className="text-primary" />
                              <span>Edit Berita</span>
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
                    itemName="berita"
                  />
                </div>
              )}

              {open.isError && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <p role="alert">{cmsError(open.error)}</p>
                </div>
              )}
            </div>
          )}

          {selected && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <button
                  type="button"
                  onClick={() => {
                    if (confirmLeave()) {
                      setSelected(null);
                    }
                  }}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span>Kembali ke Daftar Berita</span>
                </button>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl w-fit">
                  {selected.title
                    ? `Mengedit: ${selected.title.slice(0, 50)}...`
                    : "Menulis Berita Baru"}
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

              <NewsEditor
                key={`${selected.id}-${selected.version}-${editorEpoch}`}
                initial={selected}
                onSaved={(news, cacheInvalidated) => {
                  setEditorEpoch((value) => value + 1);
                  setSelected(news);
                  setNotice(
                    `Berita berhasil disimpan.${cacheInvalidated === false ? " Perubahan pada website sedang disinkronkan." : ""}`,
                  );
                  void query.refetch();
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <main className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Publikasi Berita & Media"
        description="Kelola informasi terkini, liputan kegiatan, kategori, dan pustaka media website kelurahan."
        icon={Newspaper}
      />
      <AdminAccess>
        <Workspace />
      </AdminAccess>
    </main>
  );
}
