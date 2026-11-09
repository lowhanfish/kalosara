"use client";

import React from "react";
import { Eye } from "lucide-react";
import { Modal, Badge, Button } from "@/app/(admin)/_components/ui";
import { requestLabels, type CitizenRequest } from "@/lib/community";

export interface DetailPesanModalProps {
  isOpen: boolean;
  item: CitizenRequest | null;
  onClose: () => void;
  onOpenFull: (id: string) => void;
}

export function DetailPesanModal({
  isOpen,
  item,
  onClose,
  onOpenFull,
}: DetailPesanModalProps) {
  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ringkasan Pesan Masyarakat"
      description="Pratinjau cepat pengaduan warga atau permohonan PPID"
      size="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Eye size={14} />}
            onClick={() => {
              onClose();
              onOpenFull(item.id);
            }}
          >
            Buka & Tindak Lanjuti
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="sky">
            {item.kind === "COMPLAINT"
              ? "Pengaduan Masyarakat"
              : "Permohonan PPID"}
          </Badge>
          <Badge
            variant={
              item.status === "RESOLVED"
                ? "success"
                : item.status === "IN_PROGRESS"
                  ? "warning"
                  : item.status === "NEW"
                    ? "info"
                    : "neutral"
            }
            dot
          >
            {requestLabels[item.status] ?? item.status}
          </Badge>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Subjek Pesan
          </span>
          <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
            {item.subject}
          </h3>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 space-y-2 text-xs">
          <div>
            <span className="text-slate-400 block">Pengirim</span>
            <strong className="text-slate-900">
              {item.name}
              {item.organization ? ` (${item.organization})` : ""}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block">Waktu Masuk</span>
            <strong className="text-slate-800">
              {new Intl.DateTimeFormat("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Asia/Makassar",
              }).format(new Date(item.createdAt))}
            </strong>
          </div>
        </div>
      </div>
    </Modal>
  );
}
