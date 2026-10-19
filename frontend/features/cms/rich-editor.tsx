"use client";
import { useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import type { MediaAsset } from "./client";
export function RichEditor({
  initial,
  onChange,
  images,
}: {
  initial: string;
  onChange: (html: string) => void;
  images: MediaAsset[];
}) {
  const [href, setHref] = useState("");
  const [imageId, setImageId] = useState("");
  const [warning, setWarning] = useState("");
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        underline: false,
        link: {
          openOnClick: false,
          protocols: ["https", "http", "mailto", "tel"],
        },
      }),
      Image.configure({ allowBase64: false }),
    ],
    content: initial,
    editorProps: {
      attributes: {
        class:
          "cms-rich min-h-64 rounded border border-border p-4 outline-offset-4",
        role: "textbox",
        "aria-label": "Isi berita",
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
    }),
  });
  if (!editor) return <p>Memuat editor…</p>;
  const button = (label: string, action: () => void, active = false) => (
    <button
      type="button"
      className="rounded border border-border px-3 py-2 text-[15px]"
      aria-pressed={active}
      onClick={action}
    >
      {label}
    </button>
  );
  return (
    <div className="space-y-3">
      <div
        role="group"
        aria-label="Format berita"
        className="flex flex-wrap gap-2"
      >
        {button(
          "Tebal",
          () => editor.chain().focus().toggleBold().run(),
          state?.bold,
        )}
        {button(
          "Miring",
          () => editor.chain().focus().toggleItalic().run(),
          state?.italic,
        )}
        {button("Judul H2", () =>
          editor.chain().focus().toggleHeading({ level: 2 }).run(),
        )}
        {button("Judul H3", () =>
          editor.chain().focus().toggleHeading({ level: 3 }).run(),
        )}
        {button("Kutipan", () =>
          editor.chain().focus().toggleBlockquote().run(),
        )}
        {button("Daftar poin", () =>
          editor.chain().focus().toggleBulletList().run(),
        )}
        {button("Daftar nomor", () =>
          editor.chain().focus().toggleOrderedList().run(),
        )}
        {button("Urungkan", () => editor.chain().focus().undo().run())}
        {button("Ulangi", () => editor.chain().focus().redo().run())}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1">
          URL tautan
          <input
            className="cms-input"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="https://…"
          />
        </label>
        {button("Pasang tautan", () => {
          if (!/^(https?:\/\/|mailto:|tel:)/i.test(href)) {
            setWarning("Gunakan URL HTTP/HTTPS, email atau telepon.");
            return;
          }
          editor.chain().focus().setLink({ href }).run();
          setWarning("");
        })}
        {button("Hapus tautan", () => editor.chain().focus().unsetLink().run())}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1">
          Gambar dari pustaka publik
          <select
            className="cms-input"
            aria-label="Gambar dari pustaka publik"
            value={imageId}
            onChange={(e) => setImageId(e.target.value)}
          >
            <option value="">Pilih gambar</option>
            {images.map((image) => (
              <option key={image.id} value={image.id}>
                {image.alt || image.originalName}
              </option>
            ))}
          </select>
        </label>
        {button("Sisipkan gambar", () => {
          const image = images.find((i) => i.id === imageId);
          if (image?.url)
            editor
              .chain()
              .focus()
              .setImage({
                src: image.url,
                alt: image.alt,
                title: image.caption,
              })
              .run();
        })}
      </div>
      {warning && <p role="alert">{warning}</p>}
      <EditorContent editor={editor} />
    </div>
  );
}
