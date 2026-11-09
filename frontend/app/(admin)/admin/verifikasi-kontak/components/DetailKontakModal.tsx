"use client";

import React from "react";
import { UserCheck, Mail, Phone, Clock } from "lucide-react";
import { Modal, Badge, Button } from "@/app/(admin)/_components/ui";
import type { PendingContactChange } from "../types";

export interface DetailKontakModalProps {
  isOpen: boolean;
  item: PendingContactChange | null;
  onClose: () => void;
  onReview: (item: PendingContactChange) => void;
}

export function DetailKontakModal({
  isOpen,
  item,
  onClose,
  onReview,
}: DetailKontakModalProps) {
  if (!item) return null;
  const isExpired = new Date(item.expiresAt) <= new Date();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Permohonan Perubahan Kontak"
      description="Rincian pengajuan perubahan alamat email dan nomor telepon warga"
      size="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<UserCheck size={14} />}
            onClick={() => {
              onClose();
              onReview(item);
            }}
          >
            Tinjau Permintaan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={isExpired ? "neutral" : "warning"} dot>
            {isExpired ? "Kedaluwarsa" : "Menunggu Verifikasi"}
          </Badge>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 space-y-3 text-xs">
          <div>
            <span className="text-slate-400 block">Akun Pemohon</span>
            <strong className="text-slate-900 text-sm">{item.user.email}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-sky-600" />
            <span>
              Email Baru:{" "}
              <strong className="text-slate-900">
                {item.newEmail ?? "Tetap"}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-sky-600" />
            <span>
              Nomor Baru:{" "}
              <strong className="text-slate-900">
                {item.newPhone ?? "Tetap"}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Clock size={14} />
            <span>
              Batas Waktu:{" "}
              {new Date(item.expiresAt).toLocaleString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
