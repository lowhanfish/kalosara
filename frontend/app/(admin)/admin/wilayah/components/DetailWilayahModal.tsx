"use client";

import React from "react";
import { Pencil, Users, MapPin } from "lucide-react";
import { Modal, Badge, Button } from "@/app/(admin)/_components/ui";
import { modules, type Kind, type Row } from "../types";

export interface DetailWilayahModalProps {
  isOpen: boolean;
  kind: Kind;
  item: Row | null;
  onClose: () => void;
  onEdit: (item: Row) => void;
}

export function DetailWilayahModal({
  isOpen,
  kind,
  item,
  onClose,
  onEdit,
}: DetailWilayahModalProps) {
  if (!item) return null;

  const isStat = "period" in item;
  const itemTitle = isStat ? `Statistik Periode ${item.period}` : item.name;
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
      title={`Detail ${modules[kind]}`}
      description="Informasi lengkap data statistik, fasilitas, atau potensi wilayah"
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
            Sunting Data
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="sky">{modules[kind]}</Badge>
          <Badge variant={statusVariant} dot>
            {statusLabel}
          </Badge>
          {"category" in item && item.category && (
            <Badge variant="info">{item.category}</Badge>
          )}
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Nama / Periode
          </span>
          <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
            {itemTitle}
          </h3>
        </div>

        {isStat && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 text-xs">
            <div>
              <span className="text-slate-400 block">Total Penduduk</span>
              <strong className="text-slate-900 text-sm inline-flex items-center gap-1 mt-0.5">
                <Users size={13} className="text-sky-600" />
                {item.population !== null
                  ? `${item.population.toLocaleString("id-ID")} Jiwa`
                  : "-"}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Kepala Keluarga</span>
              <strong className="text-slate-900 text-sm block mt-0.5">
                {item.households !== null
                  ? `${item.households.toLocaleString("id-ID")} KK`
                  : "-"}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Sumber Data</span>
              <strong className="text-slate-900 block mt-0.5">
                {item.source || "-"}
              </strong>
            </div>
          </div>
        )}

        {"location" in item && Boolean(item.location) && (
          <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 text-xs flex items-center gap-2">
            <MapPin size={15} className="text-sky-600 shrink-0" />
            <div>
              <span className="text-slate-400 block">Lokasi / Alamat</span>
              <strong className="text-slate-800">{String(item.location)}</strong>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
