"use client";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsMutate, cmsError } from "@/features/cms/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminLoading, AdminError } from "@/components/admin/feedback";
import { ChartColumn } from "lucide-react";
import {
  communitySections,
  type SectionSlug,
  type CommunitySection,
} from "@/lib/community";
function Editor({
  slug,
  initial,
}: {
  slug: SectionSlug;
  initial: CommunitySection | null;
}) {
  const runtime = useAuthRuntime();
  const config = communitySections[slug];
  const [form, setForm] = useState<CommunitySection>(
    initial ?? {
      title: config.title,
      content: "",
      period: "",
      source: "",
      status: "DRAFT",
      version: 0,
      metrics: config.metrics.map((label) => ({
        label,
        value: null,
        unit:
          slug === "anggaran"
            ? "Rp"
            : label.startsWith("Program")
              ? "program"
              : label.startsWith("Keluarga")
                ? "keluarga"
                : "orang",
      })),
    },
  );
  const [notice, setNotice] = useState("");
  const save = useMutation({
    mutationFn: () =>
      cmsMutate<{ version: number }>(
        runtime.request,
        `/admin/community/sections/${slug}`,
        form,
      ),
    onSuccess: (result) => {
      setForm((v) => ({ ...v, version: result.version }));
      setNotice(
        "Informasi tersimpan. Status: " +
          (form.status === "PUBLISHED"
            ? "Terbit"
            : form.status === "DRAFT"
              ? "Draft"
              : "Arsip"),
      );
    },
  });
  return (
    <form
      className="cms-editor"
      onSubmit={(e) => {
        e.preventDefault();
        setNotice("");
        save.mutate();
      }}
    >
      <h2>{config.title}</h2>
      <p>
        Gunakan data agregat yang sudah diperiksa. Jangan masukkan identitas
        penerima bansos, anak, atau pasien. Nilai kosong berarti belum tersedia.
      </p>
      <label>
        Judul
        <input
          className="cms-input"
          required
          maxLength={160}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </label>
      <label>
        Periode
        <input
          className="cms-input"
          required={form.status === "PUBLISHED"}
          maxLength={80}
          placeholder="Contoh: Tahun 2026"
          value={form.period}
          onChange={(e) => setForm({ ...form, period: e.target.value })}
        />
      </label>
      <label>
        Sumber data
        <input
          className="cms-input"
          required={form.status === "PUBLISHED"}
          maxLength={300}
          value={form.source}
          onChange={(e) => setForm({ ...form, source: e.target.value })}
        />
      </label>
      <label>
        Penjelasan
        <textarea
          className="cms-input"
          maxLength={15000}
          rows={8}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        {form.metrics.map((m, i) => (
          <fieldset
            key={i}
            className="grid gap-3 rounded-lg border border-slate-200 p-4"
          >
            <legend className="px-2 text-sm font-semibold">
              Indikator {i + 1}
            </legend>
            <label>
              Nama indikator
              <input
                className="cms-input"
                required
                maxLength={100}
                value={m.label}
                onChange={(e) =>
                  setForm({
                    ...form,
                    metrics: form.metrics.map((n, j) =>
                      j === i ? { ...n, label: e.target.value } : n,
                    ),
                  })
                }
              />
            </label>
            <label>
              Nilai
              <input
                className="cms-input"
                type="number"
                min={0}
                max={Number.MAX_SAFE_INTEGER}
                step={1}
                value={m.value ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    metrics: form.metrics.map((n, j) =>
                      j === i
                        ? {
                            ...n,
                            value:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          }
                        : n,
                    ),
                  })
                }
              />
            </label>
            <label>
              Satuan
              <select
                className="cms-input"
                value={m.unit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    metrics: form.metrics.map((n, j) =>
                      j === i
                        ? { ...n, unit: e.target.value as typeof m.unit }
                        : n,
                    ),
                  })
                }
              >
                {["Rp", "orang", "keluarga", "program", "kasus"].map((unit) => (
                  <option key={unit}>{unit}</option>
                ))}
              </select>
            </label>
          </fieldset>
        ))}
      </div>
      <label>
        Status
        <select
          className="cms-input"
          value={form.status}
          onChange={(e) =>
            setForm({
              ...form,
              status: e.target.value as CommunitySection["status"],
            })
          }
        >
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Terbit</option>
          <option value="ARCHIVED">Arsip</option>
        </select>
      </label>
      <button className="yellow-button" disabled={save.isPending}>
        {save.isPending ? "Menyimpan…" : "Simpan informasi"}
      </button>
      {save.isError && (
        <p role="alert">
          {cmsError(save.error)} Muat ulang halaman jika versi data telah
          berubah.
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
    </form>
  );
}
export default function SectionWorkspace() {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const [slug, setSlug] = useState<SectionSlug>("anggaran");
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1);
      if (Object.hasOwn(communitySections, hash)) setSlug(hash as SectionSlug);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const data = useQuery({
    queryKey: ["user", auth.user?.id, "community-section", slug],
    enabled: auth.user?.role === "ADMIN_KELURAHAN",
    queryFn: () =>
      runtime.request<{ section: CommunitySection | null }>(
        `/admin/community/sections/${slug}`,
      ),
  });
  return (
    <main id="konten">
      <AdminPageHeader
        title="Infografis & program"
        description="Kelola data anggaran, bantuan sosial, dan stunting yang ditampilkan pada website."
        icon={ChartColumn}
      />
      {auth.user?.role !== "ADMIN_KELURAHAN" ? (
        <p role="alert">Bagian ini khusus administrator.</p>
      ) : (
        <>
          <nav className="cms-channel-tabs" aria-label="Bagian infografis">
            {Object.entries(communitySections).map(([key, c]) => (
              <button
                key={key}
                aria-pressed={slug === key}
                onClick={() => {
                  if (key === slug) return;
                  if (
                    window.confirm(
                      "Pastikan perubahan sudah disimpan sebelum berpindah. Lanjutkan?",
                    )
                  ) {
                    window.location.hash = key;
                    setSlug(key as SectionSlug);
                  }
                }}
              >
                {c.title}
              </button>
            ))}
          </nav>
          {data.isPending && <AdminLoading />}
          {data.isError && (
            <AdminError
              error={data.error}
              onRetry={() => void data.refetch()}
            />
          )}
          {data.data && (
            <Editor key={slug} slug={slug} initial={data.data.section} />
          )}
        </>
      )}
    </main>
  );
}
