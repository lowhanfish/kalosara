"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsMutate, cmsError, type Category, type List } from "./client";
import { AdminPagination } from "@/components/admin/pagination";
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
  return (
    <section className="space-y-5">
      <h2 className="text-2xl font-semibold">Kategori berita</h2>
      <p>
        Slug tetap setelah dibuat. Arsipkan berita terkait sebelum mengarsipkan
        kategori.
      </p>
      <form
        className="space-y-4 rounded-xl border border-border p-5"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <label className="block">
          Nama kategori
          <input
            className="cms-input"
            required
            maxLength={120}
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        <label className="block">
          Slug kategori
          <input
            className="cms-input"
            required
            maxLength={100}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            disabled={existing}
            value={draft.slug}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
          />
        </label>
        <label className="block">
          <input
            type="checkbox"
            checked={draft.archived}
            onChange={(e) => setDraft({ ...draft, archived: e.target.checked })}
          />{" "}
          Arsipkan kategori
        </label>
        <button className="yellow-button" disabled={save.isPending}>
          Simpan kategori
        </button>
        <button
          type="button"
          className="ml-4 underline"
          onClick={() => {
            setDraft(blank());
            setExisting(false);
          }}
        >
          Kategori baru
        </button>
        {save.isError && <p role="alert">{cmsError(save.error)}</p>}
        {save.isSuccess && <p role="status">Kategori tersimpan.</p>}
      </form>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(String(new FormData(e.currentTarget).get("search") ?? ""));
        }}
      >
        <label className="min-w-0 flex-1">
          Cari kategori
          <input className="cms-input" name="search" maxLength={100} />
        </label>
        <button className="yellow-button">Cari</button>
      </form>
      {query.isError && <p role="alert">{cmsError(query.error)}</p>}
      {query.isLoading && <p>Memuat kategori…</p>}
      {query.data?.items.length === 0 && <p>Belum ada kategori.</p>}
      <ul className="space-y-3">
        {query.data?.items.map((category) => (
          <li
            className="flex flex-wrap justify-between gap-3 rounded border border-border p-4"
            key={category.id}
          >
            <span>
              {category.name} — {category.archived ? "ARSIP" : "AKTIF"}
            </span>
            <button
              className="underline"
              onClick={() => {
                setDraft(category);
                setExisting(true);
              }}
            >
              Edit kategori {category.name}
            </button>
          </li>
        ))}
      </ul>
      <AdminPagination
        page={page}
        total={query.data?.total ?? 0}
        limit={10}
        onPageChange={setPage}
        itemName="kategori"
      />
    </section>
  );
}
