"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  ShieldCheck,
  History,
  HardDrive,
  UserCheck,
  Search,
  RotateCw,
  KeyRound,
  FileText,
  ExternalLink,
  X,
  User as UserIcon,
  UserPlus,
  Eye,
  Copy,
  Check,
} from "lucide-react";
import {
  AdminEmptyState,
  AdminLoading,
  AdminError,
} from "@/components/admin/feedback";
import { UsersShieldSvg } from "@/components/admin/admin-icons";
import { AdminAccess } from "@/features/cms/admin-access";
import { useAuth } from "@/features/auth/auth-provider";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Pagination,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/app/(admin)/_components/ui";
import { listindex } from "@/utilities/pagination";
import { isUser, isAudit, isUpload, type UserItem } from "./types";
import { useResponseListMaster } from "./hooks/crud";
import { FormRegisterUserModal } from "./components/FormRegisterUserModal";
import { FormAccessUserModal } from "./components/FormAccessUserModal";
import { DetailUserModal } from "./components/DetailUserModal";

function CopyButton({
  text,
  label = "Salin",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // ignore
        }
      }}
      className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/80 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
    >
      {copied ? (
        <Check size={12} className="text-emerald-600" />
      ) : (
        <Copy size={12} />
      )}
      <span>{copied ? "Tersalin!" : label}</span>
    </button>
  );
}

function formatRole(role: string) {
  switch (role) {
    case "ADMIN_KELURAHAN":
      return {
        label: "Admin Kelurahan",
        variant: "sky" as const,
        gradient: "from-sky-400 to-blue-600",
      };
    case "LURAH":
      return {
        label: "Lurah",
        variant: "info" as const,
        gradient: "from-indigo-400 to-sky-600",
      };
    case "MASYARAKAT":
      return {
        label: "Warga",
        variant: "success" as const,
        gradient: "from-teal-400 to-emerald-600",
      };
    default:
      return {
        label: role.toLowerCase().replace(/_/g, " "),
        variant: "neutral" as const,
        gradient: "from-slate-400 to-slate-600",
      };
  }
}

function humanAction(action: string): { title: string; desc: string } {
  const map: Record<string, { title: string; desc: string }> = {
    AUTH_LOGIN: {
      title: "Pengguna Masuk Akun",
      desc: "Autentikasi sesi berhasil dilakukan",
    },
    AUTH_LOGOUT: {
      title: "Pengguna Keluar Akun",
      desc: "Sesi login ditutup dengan aman",
    },
    USER_PROVISIONED_ADMIN_KELURAHAN: {
      title: "Registrasi Administrator Baru",
      desc: "Akun administrator baru berhasil dibuat dengan hak akses penuh",
    },
    USER_PROVISIONED_LURAH: {
      title: "Registrasi Akun Lurah",
      desc: "Akun kepemimpinan lurah berhasil dibuat",
    },
    USER_PROVISIONED_MASYARAKAT: {
      title: "Registrasi Akun Pengguna",
      desc: "Akun warga baru berhasil dibuat",
    },
    USER_SET_ROLE_ADMIN_KELURAHAN: {
      title: "Perubahan Peran: Administrator",
      desc: "Pengguna diberikan hak akses penuh administrator kelurahan",
    },
    USER_SET_ROLE_LURAH: {
      title: "Perubahan Peran: Lurah",
      desc: "Pengguna diberikan peran kepemimpinan lurah",
    },
    USER_SET_ROLE_MASYARAKAT: {
      title: "Perubahan Peran: Warga",
      desc: "Peran pengguna diubah menjadi warga terdaftar",
    },
    USER_SESSION_REVOKED: {
      title: "Pencabutan Sesi Akun",
      desc: "Semua sesi pengguna dicabut oleh administrator",
    },
    USER_DEACTIVATED: {
      title: "Penonaktifan Akun",
      desc: "Akun pengguna dinonaktifkan dari sistem",
    },
    USER_ACTIVATED: {
      title: "Pengaktifan Akun",
      desc: "Akun pengguna diaktifkan kembali",
    },
    USER_PASSWORD_RESET: {
      title: "Reset Kata Sandi Akun",
      desc: "Kata sandi akun diatur ulang oleh administrator",
    },
  };
  return (
    map[action] ?? {
      title: action
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      desc: "Aktivitas pengelolaan sistem",
    }
  );
}

function Management() {
  const auth = useAuth();
  const [tab, setTab] = useState<"users" | "audit" | "uploads">("users");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [detailUser, setDetailUser] = useState<UserItem | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const query = useResponseListMaster({
    tab,
    page,
    search,
    roleFilter,
  });

  const counts = query.data?.counts;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {tab === "users"
              ? "Manajemen Pengguna & Peran"
              : tab === "audit"
                ? "Riwayat Aktivitas & Log Audit"
                : "Penggunaan Penyimpanan Berkas"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {tab === "users"
              ? "Kelola akun pengguna, daftarkan administrator kelurahan baru, dan sesuaikan peran hak akses."
              : tab === "audit"
                ? "Catatan log audit terenkripsi seluruh aktivitas pengubahan data dan keamanan sistem."
                : "Daftar berkas media, lampiran publik, dan kapasitas penyimpanan server kelurahan."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            onClick={() => setIsRegisterOpen(true)}
            leftIcon={<UserPlus size={15} />}
          >
            + Registrasi Pengguna / Admin
          </Button>

          <Link href="/admin/verifikasi-kontak">
            <Button
              variant="secondary"
              leftIcon={<UserCheck size={15} className="text-sky-600" />}
            >
              Verifikasi Kontak Warga
            </Button>
          </Link>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div
        className="cms-channel-tabs"
        role="tablist"
        aria-label="Menu pengguna dan audit"
      >
        {(
          [
            ["users", "Daftar Pengguna", Users],
            ["audit", "Riwayat Aktivitas", History],
            ["uploads", "Penyimpanan Berkas", HardDrive],
          ] as const
        ).map(([key, label, TabIcon]) => {
          const isActive = tab === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                setTab(key);
                setPage(1);
                setSearch("");
                setRoleFilter("ALL");
                setSelectedUser(null);
              }}
              className="inline-flex items-center gap-2"
            >
              <TabIcon size={16} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* 4 Summary Metrics Cards for Users Tab */}
      {tab === "users" && counts && (
        <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
          <Card
            padding="sm"
            onClick={() => {
              setRoleFilter("ALL");
              setPage(1);
            }}
            className={`cursor-pointer transition-all ${
              roleFilter === "ALL"
                ? "ring-2 ring-sky-500 border-sky-400"
                : "hover:border-sky-300"
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Total Akun
              </span>
              <div className="glass-icon-box size-9 rounded-xl">
                <Users size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {counts.total}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Semua pengguna terdaftar
            </p>
          </Card>

          <Card
            padding="sm"
            onClick={() => {
              setRoleFilter("ADMIN_KELURAHAN");
              setPage(1);
            }}
            className={`cursor-pointer transition-all ${
              roleFilter === "ADMIN_KELURAHAN"
                ? "ring-2 ring-sky-600 border-sky-400"
                : "hover:border-sky-300"
            }`}
          >
            <div className="flex items-center justify-between text-sky-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Administrator
              </span>
              <div className="glass-icon-box size-9 rounded-xl">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {counts.admin}
            </div>
            <p className="text-[11px] text-sky-600 font-semibold mt-1">
              Akses penuh sistem
            </p>
          </Card>

          <Card
            padding="sm"
            onClick={() => {
              setRoleFilter("LURAH");
              setPage(1);
            }}
            className={`cursor-pointer transition-all ${
              roleFilter === "LURAH"
                ? "ring-2 ring-indigo-500 border-indigo-400"
                : "hover:border-sky-300"
            }`}
          >
            <div className="flex items-center justify-between text-indigo-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Lurah & Pimpinan
              </span>
              <div className="glass-icon-box size-9 rounded-xl">
                <UserCheck size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {counts.lurah}
            </div>
            <p className="text-[11px] text-indigo-600 font-semibold mt-1">
              Akses monitoring
            </p>
          </Card>

          <Card
            padding="sm"
            onClick={() => {
              setRoleFilter("MASYARAKAT");
              setPage(1);
            }}
            className={`cursor-pointer transition-all ${
              roleFilter === "MASYARAKAT"
                ? "ring-2 ring-emerald-500 border-emerald-400"
                : "hover:border-sky-300"
            }`}
          >
            <div className="flex items-center justify-between text-emerald-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Warga Terdaftar
              </span>
              <div className="glass-icon-box size-9 rounded-xl">
                <UserIcon size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {counts.masyarakat}
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              Layanan mandiri
            </p>
          </Card>
        </div>
      )}

      {/* Quota Cards for Uploads Tab */}
      {tab === "uploads" && query.data?.quota && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card padding="sm" className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
              Total Berkas Tersimpan
            </span>
            <div className="text-2xl font-black text-slate-900">
              {(query.data.quota.physicalBytes / (1024 * 1024)).toFixed(1)}{" "}
              <span className="text-xs font-semibold text-slate-500">MB</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Ukuran fisik seluruh gambar dan dokumen di server kelurahan
            </p>
          </Card>

          <Card padding="sm" className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
              Batas Ukuran Berkas
            </span>
            <div className="text-2xl font-black text-slate-900">
              {Math.round(query.data.quota.perFileBytes / (1024 * 1024))}{" "}
              <span className="text-xs font-semibold text-slate-500">
                MB / file
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Maksimum per berkas gambar JPG, PNG, WebP & PDF
            </p>
          </Card>

          <Card padding="sm" className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
              Proses Simultan
            </span>
            <div className="text-2xl font-black text-slate-900">
              {query.data.quota.concurrentUploads}{" "}
              <span className="text-xs font-semibold text-slate-500">
                Proses
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Kapasitas unggahan bersamaan untuk stabilitas server
            </p>
          </Card>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="glass-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2.5 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="cms-input pl-10 pr-9 text-xs w-full"
              placeholder={
                tab === "users"
                  ? "Cari pengguna berdasarkan alamat email atau nama..."
                  : tab === "audit"
                    ? "Cari riwayat aktivitas / jenis aksi..."
                    : "Cari nama berkas media..."
              }
              value={search}
              maxLength={100}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 grid size-6 place-items-center rounded-md text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {tab === "users" && (
            <div className="shrink-0">
              <select
                className="cms-input text-xs font-semibold py-2 px-3 pr-8"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">Semua Peran</option>
                <option value="ADMIN_KELURAHAN">Admin Kelurahan</option>
                <option value="LURAH">Lurah</option>
                <option value="MASYARAKAT">Warga</option>
              </select>
            </div>
          )}
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => void query.refetch()}
          leftIcon={
            <RotateCw
              size={13}
              className={query.isFetching ? "animate-spin text-sky-600" : ""}
            />
          }
        >
          Segarkan Data
        </Button>
      </div>

      {/* Modals */}
      {isRegisterOpen && (
        <FormRegisterUserModal onClose={() => setIsRegisterOpen(false)} />
      )}
      {selectedUser && (
        <FormAccessUserModal
          key={selectedUser.id}
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
      <DetailUserModal
        isOpen={detailUser !== null}
        user={detailUser}
        isSelf={detailUser?.id === auth.user?.id}
        onClose={() => setDetailUser(null)}
        onManageAccess={(u) => setSelectedUser(u)}
      />

      {/* Loading and Error States */}
      {query.isPending && <AdminLoading />}
      {query.isError && (
        <AdminError error={query.error} onRetry={() => void query.refetch()} />
      )}

      {/* Query Data Results */}
      {query.data && (
        <div className="space-y-4">
          {query.data.items.length === 0 ? (
            <AdminEmptyState
              title="Tidak ada data ditemukan"
              description="Tidak ada data yang cocok dengan kriteria pencarian Anda. Silakan coba kata kunci atau filter lain."
            />
          ) : (
            <Card padding="sm" className="space-y-4">
              {tab === "users" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">No</TableHead>
                      <TableHead>Identitas & Email Pengguna</TableHead>
                      <TableHead>Peran (Role)</TableHead>
                      <TableHead>Status Akun</TableHead>
                      <TableHead>Terdaftar</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {query.data.items.map((item, idx) => {
                      if (!isUser(item)) return null;
                      const roleInfo = formatRole(item.role);
                      const isSelf = item.id === auth.user?.id;
                      const initialLetter = (
                        item.profile?.displayName || item.email
                      )
                        .charAt(0)
                        .toUpperCase();
                      const formattedDate = item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "-";

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-center font-bold text-slate-400 text-xs">
                            {listindex(10, page, idx)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className={`grid size-9 shrink-0 place-items-center rounded-xl font-extrabold text-xs text-white bg-linear-to-br ${roleInfo.gradient}`}
                              >
                                {initialLetter}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-slate-900 text-sm truncate">
                                    {item.profile?.displayName || item.email}
                                  </span>
                                  {isSelf && (
                                    <Badge variant="sky" size="sm">
                                      Anda
                                    </Badge>
                                  )}
                                </div>
                                {item.profile?.displayName && (
                                  <p className="text-xs text-slate-500 truncate">
                                    {item.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={roleInfo.variant}>
                              {roleInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={item.isActive ? "success" : "danger"}
                              dot
                            >
                              {item.isActive ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {formattedDate}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDetailUser(item)}
                                leftIcon={<Eye size={13} />}
                              >
                                Detail
                              </Button>
                              {!isSelf && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setSelectedUser(item)}
                                  leftIcon={<KeyRound size={13} />}
                                >
                                  Kelola Akses
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {tab === "audit" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">No</TableHead>
                      <TableHead>Aktivitas & Deskripsi</TableHead>
                      <TableHead>Modul / Resource</TableHead>
                      <TableHead>Pelaku</TableHead>
                      <TableHead className="text-right">Waktu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {query.data.items.map((item, idx) => {
                      if (!isAudit(item)) return null;
                      const meta = humanAction(item.action);
                      const formattedDate = new Date(
                        item.createdAt,
                      ).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-center font-bold text-slate-400 text-xs">
                            {listindex(10, page, idx)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="font-extrabold text-slate-900 text-sm block">
                                {meta.title}
                              </span>
                              <span className="text-xs text-slate-500">
                                {meta.desc}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.resourceType ? (
                              <Badge variant="sky">{item.resourceType}</Badge>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-slate-700">
                            {item.actorId ? "Administrator" : "Sistem"}
                          </TableCell>
                          <TableCell className="text-right text-xs text-slate-500">
                            {formattedDate}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {tab === "uploads" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">No</TableHead>
                      <TableHead>Berkas Media</TableHead>
                      <TableHead>Ukuran</TableHead>
                      <TableHead>Visibilitas & Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {query.data.items.map((item, idx) => {
                      if (!isUpload(item)) return null;
                      const isImage = /\.(jpe?g|png|webp|gif|svg)$/i.test(
                        item.originalName,
                      );
                      const sizeInMb = (item.size / (1024 * 1024)).toFixed(2);
                      const sizeInKb = Math.round(item.size / 1024);
                      const sizeText =
                        item.size >= 1024 * 1024
                          ? `${sizeInMb} MB`
                          : `${sizeInKb} KB`;
                      const fileUrl = `/api/v1/public/media/${item.id}`;

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-center font-bold text-slate-400 text-xs">
                            {listindex(10, page, idx)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-sky-200 bg-sky-50 grid place-items-center">
                                {isImage ? (
                                  <Image
                                    src={fileUrl}
                                    alt={item.originalName}
                                    fill
                                    unoptimized
                                    className="object-cover"
                                  />
                                ) : (
                                  <FileText
                                    size={18}
                                    className="text-sky-600"
                                  />
                                )}
                              </div>
                              <span className="font-extrabold text-slate-900 text-sm truncate max-w-xs">
                                {item.originalName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-bold text-slate-700">
                            {sizeText}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant={
                                  item.visibility === "PUBLIC"
                                    ? "sky"
                                    : "warning"
                                }
                              >
                                {item.visibility === "PUBLIC"
                                  ? "Publik"
                                  : "Privat"}
                              </Badge>
                              <Badge
                                variant={item.archived ? "neutral" : "success"}
                              >
                                {item.archived ? "Arsip" : "Aktif"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center justify-end gap-2">
                              <CopyButton text={fileUrl} label="Salin Tautan" />
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="glass-button-secondary !min-h-8 px-3 py-1 text-xs"
                              >
                                <ExternalLink
                                  size={13}
                                  className="text-sky-600"
                                />
                                <span>Buka</span>
                              </a>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              <Pagination
                currentPage={page}
                totalPages={Math.ceil((query.data.total ?? 0) / 10)}
                totalItems={query.data.total ?? 0}
                pageSize={10}
                onPageChange={setPage}
                itemName="entri"
              />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default function PenggunaPage() {
  return (
    <main className="min-w-0 space-y-6">
      <PageHeader
        title="Pengguna & Keamanan Sistem"
        description="Kelola akun pengguna, registrasi administrator kelurahan, pantau audit log aktivitas, dan kapasitas penyimpanan berkas."
        icon={UsersShieldSvg}
        badge={{ text: "Kontrol Akses & Audit", variant: "sky" }}
      />
      <AdminAccess>
        <Management />
      </AdminAccess>
    </main>
  );
}
