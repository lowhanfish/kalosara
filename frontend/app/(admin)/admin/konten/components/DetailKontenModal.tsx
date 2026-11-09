"use client";

import React from "react";
import { Pencil, MapPin, Clock, Pin } from "lucide-react";
import { Modal, Badge, Button } from "@/app/(admin)/_components/ui";
import { channels, type ContentKind, type ContentItem } from "@/lib/content";

export interface DetailKontenModalProps {
  isOpen: boolean;
  kind: ContentKind;
  item: ContentItem | null;
  onClose: () => void;
  onEdit: (item: ContentItem) => void;
}

export function DetailKontenModal({
  isOpen,
  kind,
  item,
  onClose,
  onEdit,
}: DetailKontenModalProps) {
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
      title={`Detail ${channels[kind].title}`}
      description="Ringkasan informasi konten kelurahan"
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Pencil size={14} />}
            onClick={() => {
              onClose();
              onEdit(item);
            }}
          >
            Sunting Konten
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="sky">{channels[kind].title}</Badge>
          <Badge variant={statusVariant} dot>
            {statusLabel}
          </Badge>
          {item.announcement?.pinned && (
            <Badge variant="warning">
              <Pin size={11} /> Disematkan
            </Badge>
          )}
          {item.document?.category && (
            <Badge variant="info">{item.document.category}</Badge>
          )}
          {item.gallery?.photos && (
            <Badge variant="info">{item.gallery.photos.length} Foto</Badge>
          )}
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Judul {channels[kind].title}
          </span>
          <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
            {item.title}
          </h3>
        </div>

        {item.event && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-4 text-xs">
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-sky-600" />
              <div>
                <span className="text-slate-400 block">Lokasi Kegiatan</span>
                <strong className="text-slate-800">
                  {item.event.location || "-"}
                </strong>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-sky-600" />
              <div>
                <span className="text-slate-400 block">Waktu Mulai</span>
                <strong className="text-slate-800">
                  {item.event.start ? item.event.start.slice(0, 10) : "-"}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
