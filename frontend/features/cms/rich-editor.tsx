"use client";

import { useState } from "react";
import Image from "next/image";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Link2,
  Unlink,
  ImagePlus,
  Minus,
  RemoveFormatting,
  X,
  Search,
  UploadCloud,
  RefreshCw,
  AlertCircle,
  ImageIcon,
} from "lucide-react";
import { useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsMutate, cmsError, type MediaAsset } from "./client";

export function RichEditor({
  initial,
  onChange,
  images,
}: {
  initial: string;
  onChange: (html: string) => void;
  images: MediaAsset[];
}) {
  const runtime = useAuthRuntime();
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalTab, setModalTab] = useState<"upload" | "library">("upload");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadAlt, setUploadAlt] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageSearch, setImageSearch] = useState("");
  const [warning, setWarning] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: {},
        underline: false,
        link: {
          openOnClick: false,
          protocols: ["https", "http", "mailto", "tel"],
        },
      }),
      TiptapImage.configure({ allowBase64: false }),
    ],
    content: initial,
    editorProps: {
      attributes: {
        class:
          "cms-rich min-h-[320px] max-w-none p-5 focus:outline-none leading-relaxed",
        role: "textbox",
        "aria-label": "Isi editor berita",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      h2: editor?.isActive("heading", { level: 2 }) ?? false,
      h3: editor?.isActive("heading", { level: 3 }) ?? false,
      blockquote: editor?.isActive("blockquote") ?? false,
      bulletList: editor?.isActive("bulletList") ?? false,
      orderedList: editor?.isActive("orderedList") ?? false,
      link: editor?.isActive("link") ?? false,
    }),
  });

  if (!editor) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Memuat editor teks…
      </div>
    );
  }

  const text = editor.getText();
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  const handleApplyLink = () => {
    if (!linkUrl) {
      editor.chain().focus().unsetLink().run();
      setShowLinkModal(false);
      return;
    }
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(linkUrl)) {
      setWarning("URL harus diawali dengan http://, https://, mailto:, atau tel:");
      return;
    }
    editor.chain().focus().setLink({ href: linkUrl }).run();
    setLinkUrl("");
    setWarning("");
    setShowLinkModal(false);
  };

  const handleInsertImage = (image: MediaAsset) => {
    const src = image.url ?? `/api/v1/public/media/${image.id}`;
    editor
      .chain()
      .focus()
      .setImage({
        src,
        alt: image.alt || image.originalName,
        title: image.caption || image.originalName,
      })
      .run();
    setShowImageModal(false);
  };

  const handleUploadAndInsert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Pilih file gambar terlebih dahulu.");
      return;
    }
    if (uploadFile.size > 20 * 1024 * 1024) {
      setUploadError("Ukuran file gambar maksimal 20 MB.");
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("visibility", "PUBLIC");
      const cleanAlt =
        uploadAlt.trim() ||
        uploadFile.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]+/g, " ")
          .trim()
          .slice(0, 100);
      formData.append("alt", cleanAlt || "Gambar artikel");
      formData.append("caption", uploadCaption.trim());
      formData.append("source", "general");

      const response = await cmsMutate<{ asset: MediaAsset }>(
        runtime.request,
        "/admin/media",
        formData,
        "POST",
      );
      handleInsertImage(response.asset);
      setUploadFile(null);
      setUploadAlt("");
      setUploadCaption("");
    } catch (err) {
      setUploadError(cmsError(err));
    } finally {
      setIsUploading(false);
    }
  };

  const filteredImages = images.filter((img) =>
    (img.alt || img.originalName || "").toLowerCase().includes(imageSearch.toLowerCase()),
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
      {/* CKEditor / TinyMCE style Toolbar Header */}
      <div
        role="toolbar"
        aria-label="Bilah alat format teks"
        className="flex flex-wrap items-center gap-1 border-b border-slate-200/80 bg-slate-50/90 p-2 text-slate-700"
      >
        {/* Undo & Redo */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-slate-200">
          <button
            type="button"
            title="Urungkan (Undo)"
            aria-label="Urungkan (Undo)"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-200/80 disabled:opacity-40 transition-colors"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Ulangi (Redo)"
            aria-label="Ulangi (Redo)"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-200/80 disabled:opacity-40 transition-colors"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 px-1 border-r border-slate-200">
          <button
            type="button"
            title="Judul Bab (H2)"
            aria-label="Judul Bab (H2)"
            aria-pressed={state?.h2}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors font-bold ${
              state?.h2
                ? "bg-primary text-white shadow-xs"
                : "hover:bg-slate-200/80"
            }`}
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Subjudul (H3)"
            aria-label="Subjudul (H3)"
            aria-pressed={state?.h3}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors font-bold ${
              state?.h3
                ? "bg-primary text-white shadow-xs"
                : "hover:bg-slate-200/80"
            }`}
          >
            <Heading3 className="h-4 w-4" />
          </button>
        </div>

        {/* Text Formats */}
        <div className="flex items-center gap-0.5 px-1 border-r border-slate-200">
          <button
            type="button"
            title="Tebal (Bold)"
            aria-label="Tebal (Bold)"
            aria-pressed={state?.bold}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors font-bold ${
              state?.bold
                ? "bg-primary text-white shadow-xs"
                : "hover:bg-slate-200/80"
            }`}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Miring (Italic)"
            aria-label="Miring (Italic)"
            aria-pressed={state?.italic}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              state?.italic
                ? "bg-primary text-white shadow-xs"
                : "hover:bg-slate-200/80"
            }`}
          >
            <Italic className="h-4 w-4" />
          </button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center gap-0.5 px-1 border-r border-slate-200">
          <button
            type="button"
            title="Daftar Poin (Bullet List)"
            aria-label="Daftar Poin"
            aria-pressed={state?.bulletList}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              state?.bulletList
                ? "bg-primary text-white shadow-xs"
                : "hover:bg-slate-200/80"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Daftar Nomor (Numbered List)"
            aria-label="Daftar Nomor"
            aria-pressed={state?.orderedList}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              state?.orderedList
                ? "bg-primary text-white shadow-xs"
                : "hover:bg-slate-200/80"
            }`}
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Kutipan (Blockquote)"
            aria-label="Kutipan"
            aria-pressed={state?.blockquote}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              state?.blockquote
                ? "bg-primary text-white shadow-xs"
                : "hover:bg-slate-200/80"
            }`}
          >
            <Quote className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Garis Pemisah (Horizontal Rule)"
            aria-label="Garis Pemisah"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-200/80 transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>

        {/* Links & Media */}
        <div className="flex items-center gap-0.5 px-1 border-r border-slate-200">
          <button
            type="button"
            title={state?.link ? "Ubah tautan" : "Sisipkan tautan (Link)"}
            aria-label="Sisipkan tautan"
            aria-pressed={state?.link}
            onClick={() => {
              setWarning("");
              setShowLinkModal(!showLinkModal);
            }}
            className={`flex h-8 items-center gap-1 px-2.5 rounded-lg text-xs font-semibold transition-colors ${
              state?.link || showLinkModal
                ? "bg-primary text-white shadow-xs"
                : "hover:bg-slate-200/80"
            }`}
          >
            <Link2 className="h-3.5 w-3.5" />
            <span>Tautan</span>
          </button>

          {state?.link && (
            <button
              type="button"
              title="Hapus tautan"
              aria-label="Hapus tautan"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-50 text-red-600 transition-colors"
            >
              <Unlink className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            title="Sisipkan gambar dari pustaka media"
            aria-label="Sisipkan gambar dari pustaka media"
            onClick={() => setShowImageModal(true)}
            className="flex h-8 items-center gap-1 px-2.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            <span>Sisipkan Gambar</span>
          </button>
        </div>

        {/* Clear formatting */}
        <div className="ml-auto flex items-center">
          <button
            type="button"
            title="Hapus format (Clear formatting)"
            aria-label="Hapus format"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-200/80 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <RemoveFormatting className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Inline Link Toolbar Popover */}
      {showLinkModal && (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-100/90 p-3 text-xs">
          <span className="font-semibold text-slate-700">URL Tautan:</span>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://contoh.id/dokumen"
            className="h-8 min-w-[240px] flex-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-primary"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApplyLink();
              }
            }}
          />
          <button
            type="button"
            onClick={handleApplyLink}
            className="h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-white shadow-xs hover:bg-primary-hover transition-colors"
          >
            Terapkan
          </button>
          <button
            type="button"
            onClick={() => setShowLinkModal(false)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          {warning && (
            <p className="w-full text-[11px] text-red-600 font-medium mt-1">
              {warning}
            </p>
          )}
        </div>
      )}

      {/* Editor Content Area */}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* Status Bar: Word count & Help */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <span>{wordCount} kata</span>
          <span>·</span>
          <span>{charCount} karakter</span>
        </div>
        <div className="hidden sm:block text-slate-400">
          Tip: Gunakan Ctrl+B / Cmd+B untuk tebal, Ctrl+Z untuk batalkan
        </div>
      </div>

      {/* Modal Visual Media Gallery Picker & Uploader */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Sisipkan Gambar ke Artikel</h3>
                <p className="text-xs text-slate-500">
                  Unggah file gambar baru dari komputer atau pilih dari pustaka media kelurahan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImageModal(false);
                  setUploadError(null);
                  setUploadFile(null);
                }}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-100 px-6 pt-3 gap-4 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setModalTab("upload")}
                className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                  modalTab === "upload"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <UploadCloud size={15} />
                <span>Unggah Gambar Baru</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab("library")}
                className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                  modalTab === "library"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <ImageIcon size={15} />
                <span>Pilih dari Pustaka ({images.length})</span>
              </button>
            </div>

            {modalTab === "upload" ? (
              <form onSubmit={handleUploadAndInsert} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    File Gambar (JPG, PNG, WebP · Maks 20 MB)
                  </label>
                  <input
                    type="file"
                    required
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setUploadFile(file);
                      if (file && !uploadAlt) {
                        setUploadAlt(
                          file.name
                            .replace(/\.[^/.]+$/, "")
                            .replace(/[-_]+/g, " ")
                            .trim()
                            .slice(0, 100),
                        );
                      }
                    }}
                    className="cms-input"
                  />
                  <p className="text-[11px] text-slate-400">
                    File akan diunggah via multipart multer dan disimpan ke folder upload backend.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Teks Alternatif (Alt Text)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={300}
                    placeholder="Deskripsi singkat gambar untuk aksesibilitas dan pembaca layar"
                    value={uploadAlt}
                    onChange={(e) => setUploadAlt(e.target.value)}
                    className="cms-input"
                    disabled={isUploading}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Keterangan Gambar / Kapsi (Opsional)
                  </label>
                  <input
                    type="text"
                    maxLength={1000}
                    placeholder="Keterangan gambar yang tampil sebagai judul tooltip"
                    value={uploadCaption}
                    onChange={(e) => setUploadCaption(e.target.value)}
                    className="cms-input"
                    disabled={isUploading}
                  />
                </div>

                {uploadError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    <AlertCircle size={15} className="shrink-0 text-red-600" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={!uploadFile || isUploading}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Mengunggah & Menyisipkan...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={14} />
                        <span>Unggah & Sisipkan ke Artikel</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="border-b border-slate-100 p-4 bg-slate-50/50">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari gambar berdasarkan nama / teks alternatif..."
                      value={imageSearch}
                      onChange={(e) => setImageSearch(e.target.value)}
                      className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {filteredImages.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500">
                      Tidak ada gambar publik yang ditemukan di pustaka.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {filteredImages.map((img) => {
                        const imgSrc = img.url ?? `/api/v1/public/media/${img.id}`;
                        return (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => handleInsertImage(img)}
                            className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left transition hover:border-primary hover:shadow-md"
                          >
                            <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-200">
                              <Image
                                src={imgSrc}
                                alt={img.alt || img.originalName}
                                fill
                                unoptimized
                                className="object-cover transition duration-300 group-hover:scale-105"
                              />
                            </div>
                            <div className="p-2.5">
                              <p className="truncate text-xs font-semibold text-slate-800 group-hover:text-primary">
                                {img.alt || img.originalName}
                              </p>
                              <p className="truncate text-[10px] text-slate-400 mt-0.5">
                                {img.originalName}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end border-t border-slate-100 px-6 py-3 bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => {
                  setShowImageModal(false);
                  setUploadError(null);
                  setUploadFile(null);
                }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
