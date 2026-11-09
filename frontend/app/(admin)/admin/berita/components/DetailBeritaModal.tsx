"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
import { Modal, Badge, Button } from "@/app/(admin)/_components/ui";
import type { ResponseInterface } from "../types";

export interface DetailBeritaModalProps {
  isOpen: boolean;
  item: ResponseInterface | null;
  onClose: () => void;
  onEdit: (id: string) => void;
}

export function DetailBeritaModal({
  isOpen,
  item,
  onClose,
  onEdit,
}: DetailBeritaModalProps) {
  if (!item) return null;

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Publikasi Berita"
      description="Ringkasan metadata dan status artikel berita kelurahan"
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
          {item.slug && item.status === "PUBLISHED" && (
            <Link href={`/berita/${item.slug}`} target="_blank">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ExternalLink size={14} />}
              >
                Lihat di Portal
              </Button>
            </Link>
          )}
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Pencil size={14} />}
            onClick={() => {
              onClose();
              onEdit(item.id);
            }}
          >
            Sunting Artikel
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="sky">{item.category?.name || "Umum"}</Badge>
          <Badge variant={statusVariant} dot>
            {statusLabel}
          </Badge>
          <Badge variant="neutral">Revisi v{item.version}</Badge>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Judul Artikel
          </span>
          <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
            {item.title}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block">
              Tautan Slug Publik
            </span>
            <code className="font-mono font-bold text-sky-800 mt-0.5 block">
              /berita/{item.slug || "-"}
            </code>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block">
              Terakhir Diperbarui
            </span>
            <span className="font-bold text-slate-800 mt-0.5 block">
              {item.updatedAt
                ? new Date(item.updatedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Baru saja"}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
