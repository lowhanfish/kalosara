"use client";

import { useState, useRef, useId } from "react";
import Image from "next/image";
import {
  UploadCloud,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import { useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsMutate, cmsError, type MediaAsset } from "@/features/cms/client";

export type ImageUploadFieldProps = {
  label?: string;
  description?: string;
  value: string | null;
  onChange: (value: string | null, asset?: MediaAsset) => void;
  valueType?: "url" | "id";
  source?:
    | "news"
    | "profile"
    | "officials"
    | "settings"
    | "general"
    | "announcements"
    | "events"
    | "galleries"
    | "facilities"
    | "potentials";
  visibility?: "PUBLIC" | "PRIVATE";
  altDefault?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "wide" | "portrait";
  disabled?: boolean;
};

export function ImageUploadField({
  label,
  description,
  value,
  onChange,
  valueType = "url",
  source = "general",
  visibility = "PUBLIC",
  altDefault,
  className = "",
  aspectRatio = "video",
  disabled = false,
}: ImageUploadFieldProps) {
  const runtime = useAuthRuntime();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);

  // Compute image preview URL
  const previewSrc = value
    ? valueType === "id"
      ? `/api/v1/public/media/${value}`
      : value
    : null;

  const handleUploadFile = async (file: File) => {
    if (!file) return;

    // Validate size (20 MB)
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage("Ukuran gambar melebihi batas 20 MB.");
      return;
    }

    // Validate type
    const validMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!validMimes.includes(file.type)) {
      setErrorMessage("Format harus berupa JPG, PNG, atau WebP.");
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);
    setJustUploaded(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("visibility", visibility);
      const cleanAlt =
        altDefault ||
        file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]+/g, " ")
          .trim()
          .slice(0, 100);
      formData.append("alt", cleanAlt || "Gambar konten");
      formData.append("caption", "");
      formData.append("source", source);

      const response = await cmsMutate<{ asset: MediaAsset }>(
        runtime.request,
        "/admin/media",
        formData,
        "POST",
      );

      const asset = response.asset;
      const returnedValue =
        valueType === "id" ? asset.id : asset.url ?? `/api/v1/public/media/${asset.id}`;

      onChange(returnedValue, asset);
      setJustUploaded(true);
      setTimeout(() => setJustUploaded(false), 3000);
    } catch (err) {
      setErrorMessage(cmsError(err));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleUploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleUploadFile(file);
    }
  };

  const aspectClass = {
    square: "aspect-square max-w-[200px]",
    portrait: "aspect-[3/4] max-w-[200px]",
    video: "aspect-video max-w-sm",
    wide: "aspect-[21/9] max-w-md",
  }[aspectRatio];

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
        >
          {label}
        </label>
      )}

      {description && <p className="text-xs text-slate-500">{description}</p>}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="sr-only"
        aria-describedby={errorMessage ? `${inputId}-error` : undefined}
      />

      {/* If an image is selected/uploaded, show preview card */}
      {previewSrc ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div
              className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 ${aspectClass} w-full`}
            >
              <Image
                src={previewSrc}
                alt={label ?? "Pratinjau gambar"}
                fill
                unoptimized
                className="object-cover"
              />
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                {justUploaded ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 size={13} />
                    Berhasil diunggah ke server
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                    <ImageIcon size={13} />
                    Gambar aktif
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 font-mono break-all truncate max-w-md">
                {value}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={disabled || isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw
                    size={13}
                    className={isUploading ? "animate-spin text-primary" : ""}
                  />
                  <span>{isUploading ? "Mengunggah..." : "Ganti Foto"}</span>
                </button>

                <button
                  type="button"
                  disabled={disabled || isUploading}
                  onClick={() => onChange(null)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 transition-colors"
                >
                  <X size={13} />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Upload Drag & Drop Area */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !isUploading) setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !isUploading) fileInputRef.current?.click();
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
            isDragOver
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-slate-200/90 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50/90"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-slate-600 group-hover:text-primary group-hover:border-primary/30 transition-colors mb-3">
            {isUploading ? (
              <RefreshCw size={22} className="animate-spin text-primary" />
            ) : (
              <UploadCloud size={22} />
            )}
          </div>

          <p className="text-sm font-semibold text-slate-800">
            {isUploading ? (
              <span className="text-primary font-bold">
                Mengunggah gambar ke server...
              </span>
            ) : (
              <>
                <span className="text-primary hover:underline font-bold">
                  Klik untuk pilih file
                </span>{" "}
                atau seret ke sini
              </>
            )}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            JPG, PNG, atau WebP · Disimpan otomatis di direktori backend (Maks 20 MB)
          </p>
        </div>
      )}

      {errorMessage && (
        <div
          id={`${inputId}-error`}
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
        >
          <AlertCircle size={15} className="shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
