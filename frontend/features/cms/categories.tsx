"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FolderTree,
  Plus,
  Pencil,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsMutate, cmsError, type Category, type List } from "./client";
import { AdminPagination } from "@/components/admin/pagination";
import { AdminEmptyState, AdminLoading, AdminError } from "@/components/admin/feedback";

export function Categories() {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const cache = useQueryClient();
  const blank = (): Category => ({
    id: crypto.randomUUID(),
    name: "",
    slug: "",
    archived: false,
  });

  const [draft, setDraft] = useState<Category>(blank);
  const [existing, setExisting] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["user", auth.user?.id, "cms-categories", page, search],
    queryFn: () =>
      runtime.request<List<Category>>(
        `/admin/news/categories?page=${page}&search=${encodeURIComponent(search)}`,
      ),
  });

  const save = useMutation({
    mutationFn: () =>
      cmsMutate(runtime.request, `/admin/news/categories/${draft.id}`, {
        name: draft.name,
        slug: draft.slug,
        archived: draft.archived,
      }),
    onSuccess: () => {
      setDraft(blank());
      setExisting(false);
      void cache.invalidateQueries({
        queryKey: ["user", auth.user?.id, "cms-categories"],
      });
    },
  });

  const handleNameChange = (val: string) => {
    if (!existing) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setDraft({ ...draft, name: val, slug: generatedSlug });
    } else {
      setDraft({ ...draft, name: val });
    }
  };

  return (
    <section className="space-y-6">
      {/* Category Editor / Form Glass Card */}
      <div className="glass-card p-6 sm:p-7 space-y-5">
        <div className="flex items-start justify-between border-b border-blue-100/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="glass-icon-box size-10">
              <FolderTree size={19} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {existing ? "Sunting Kategori Berita" : "Tambah Kategori Berita Baru"}
              </h3>
              <p className="text-xs font-medium text-slate-500">
                Kategori digunakan untuk mengelompokkan arsip dan publikasi berita pada portal kelurahan.
              </p>
            </div>
          </div>
          {existing && (
            <button
              type="button"
              onClick={() => {
                setDraft(blank());
                setExisting(false);
              }}
              className="glass-button-secondary"
            >
              <Plus size={14} strokeWidth={2.2} />
              <span>Buat Baru</span>
            </button>
          )}
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Nama Kategori <span className="text-red-500">*</span>
              </label>
              <input
                className="cms-input"
                required
                maxLength={120}
                placeholder="misal: Pembangunan Wilayah"
                value={draft.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Slug URL <span className="text-red-500">*</span>
              </label>
              <input
                className="cms-input font-mono text-xs"
                required
                maxLength={100}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                disabled={existing}
                placeholder="misal: pembangunan-wilayah"
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
              />
              {existing && (
                <p className="text-[11px] text-slate-400">
                  Slug kategori yang sudah dibuat bersifat permanen demi konsistensi tautan.
                </p>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2.5 rounded-xl border border-blue-200/70 bg-blue-50/40 p-3.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.archived}
              onChange={(e) => setDraft({ ...draft, archived: e.target.checked })}
              className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-semibold">
              Arsipkan kategori ini (tidak ditampilkan lagi pada pilihan berita baru)
            </span>
          </label>

          {save.isError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle size={15} className="shrink-0 text-red-600" />
              <span>{cmsError(save.error)}</span>
            </div>
          )}

          {save.isSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 font-semibold">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>Kategori berhasil disimpan ke database.</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            {existing && (
              <button
                type="button"
                onClick={() => {
                  setDraft(blank());
                  setExisting(false);
                }}
                className="glass-button-secondary"
              >
                Batal Edit
              </button>
            )}
            <button
              type="submit"
              disabled={save.isPending}
              className="glass-button-primary"
            >
              {save.isPending ? (
                <>
                  <RotateCw size={14} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Plus size={15} strokeWidth={2.4} />
                  <span>{existing ? "Simpan Perubahan Kategori" : "Simpan Kategori Baru"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Category Search & Filter Glass Toolbar */}
      <div className="glass-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
          <input
            className="cms-input pl-10 pr-9 text-xs"
            placeholder="Cari nama atau slug kategori berita..."
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

        <button
          type="button"
          onClick={() => void query.refetch()}
          className="glass-button-secondary self-start sm:self-auto"
        >
          <RotateCw size={14} className={query.isFetching ? "animate-spin text-blue-600" : ""} />
          <span>Segarkan</span>
        </button>
      </div>

      {/* Category List */}
      {query.isPending && <AdminLoading />}
      {query.isError && <AdminError error={query.error} onRetry={() => void query.refetch()} />}

      {query.data?.items.length === 0 && (
        <AdminEmptyState
          title="Belum ada kategori"
          description="Tambahkan kategori berita melalui formulir di atas untuk mengelompokkan artikel."
        />
      )}

      {query.data && query.data.items.length > 0 && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {query.data.items.map((category) => (
              <div
                key={category.id}
                className="glass-list-card flex items-center justify-between gap-3 overflow-hidden"
              >
                <span
                  className={`pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${
                    category.archived
                      ? "from-slate-400 to-slate-500"
                      : "from-blue-500 to-indigo-600"
                  }`}
                />
                <div className="flex items-center gap-3.5 min-w-0 pl-1">
                  <div className="glass-icon-box size-11">
                    <FolderTree size={19} strokeWidth={2} />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-sm truncate">
                        {category.name}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          category.archived
                            ? "bg-slate-100 text-slate-600 border border-slate-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {category.archived ? "Arsip" : "Aktif"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-mono truncate">
                      /berita/kategori/{category.slug}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDraft(category);
                    setExisting(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="glass-button-secondary shrink-0"
                >
                  <Pencil size={13} strokeWidth={2.2} />
                  <span>Sunting</span>
                </button>
              </div>
            ))}
          </div>

          <AdminPagination
            page={page}
            total={query.data.total ?? 0}
            limit={10}
            onPageChange={setPage}
            itemName="kategori"
          />
        </div>
      )}
    </section>
  );
}
