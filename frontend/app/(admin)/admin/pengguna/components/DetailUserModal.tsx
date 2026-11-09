"use client";

import React from "react";
import { KeyRound } from "lucide-react";
import { Modal, Badge, Button } from "@/app/(admin)/_components/ui";
import type { UserItem } from "../types";

export interface DetailUserModalProps {
  isOpen: boolean;
  user: UserItem | null;
  isSelf: boolean;
  onClose: () => void;
  onManageAccess: (user: UserItem) => void;
}

export function DetailUserModal({
  isOpen,
  user,
  isSelf,
  onClose,
  onManageAccess,
}: DetailUserModalProps) {
  if (!user) return null;

  const roleLabel =
    user.role === "ADMIN_KELURAHAN"
      ? "Administrator Kelurahan"
      : user.role === "LURAH"
        ? "Lurah"
        : "Warga Terdaftar";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Akun Pengguna"
      description="Informasi identitas akun dan status hak akses sistem"
      size="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
          {!isSelf && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<KeyRound size={14} />}
              onClick={() => {
                onClose();
                onManageAccess(user);
              }}
            >
              Kelola Akses & Peran
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="sky">{roleLabel}</Badge>
          <Badge variant={user.isActive ? "success" : "danger"} dot>
            {user.isActive ? "Aktif" : "Nonaktif"}
          </Badge>
          {isSelf && <Badge variant="info">Akun Anda</Badge>}
        </div>

        <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 space-y-3 text-xs">
          <div>
            <span className="text-slate-400 block">Nama Tampilan</span>
            <strong className="text-slate-900 text-sm">
              {user.profile?.displayName || "Belum diatur"}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block">Alamat Email</span>
            <strong className="text-slate-900 text-sm">{user.email}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Tanggal Terdaftar</span>
            <strong className="text-slate-800">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "-"}
            </strong>
          </div>
        </div>
      </div>
    </Modal>
  );
}
