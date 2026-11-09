"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Users,
  ShieldCheck,
  History,
  HardDrive,
  UserCheck,
  Search,
  RotateCw,
  KeyRound,
  Lock,
  FileText,
  ImageIcon,
  Settings,
  ExternalLink,
  X,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  User as UserIcon,
  FileCode2,
  UserPlus,
  Shield,
  Plus,
} from "lucide-react";
import { AdminEmptyState, AdminLoading, AdminError } from "@/components/admin/feedback";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/pagination";
import { AdminAccess } from "@/features/cms/admin-access";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsError, cmsMutate, type List } from "@/features/cms/client";

type User = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  updatedAt: string;
};

type Audit = {
  id: string;
  actorId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  requestId: string | null;
  ipHash: string | null;
  createdAt: string;
};

type Upload = {
  id: string;
  originalName: string;
  size: number;
  visibility: string;
  archived: boolean;
};

type Uploads = List<Upload> & {
  quota: {
    perFileBytes: number;
    physicalBytes: number;
    concurrentUploads: number;
    totalLimitBytes: null;
  };
};

function formatRole(role: string) {
  switch (role) {
    case "ADMIN_KELURAHAN":
      return {
        label: "Administrator",
        badge: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
        dot: "bg-indigo-500",
      };
    case "LURAH":
      return {
        label: "Lurah",
        badge: "bg-purple-50 text-purple-700 border-purple-200/80",
        dot: "bg-purple-500",
      };
    case "MASYARAKAT":
      return {
        label: "Warga Terdaftar",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        dot: "bg-emerald-500",
      };
    default:
      return {
        label: role.toLowerCase().replace(/_/g, " "),
        badge: "bg-slate-100 text-slate-700 border-slate-200",
        dot: "bg-slate-400",
      };
  }
}

function humanAction(action: string): { title: string; desc: string; icon: typeof FileText; tone: string } {
  const map: Record<string, { title: string; desc: string; icon: typeof FileText; tone: string }> = {
    AUTH_LOGIN: {
      title: "Pengguna Masuk Akun",
      desc: "Autentikasi sesi berhasil",
      icon: Lock,
      tone: "text-emerald-600 bg-emerald-50",
    },
    AUTH_LOGOUT: {
      title: "Pengguna Keluar Akun",
      desc: "Sesi autentikasi ditutup",
      icon: Lock,
      tone: "text-slate-600 bg-slate-50",
    },
    USER_PROVISIONED_ADMIN_KELURAHAN: {
      title: "Registrasi Administrator Baru",
      desc: "Akun administrator baru berhasil dibuat dengan hak akses penuh",
      icon: UserPlus,
      tone: "text-indigo-600 bg-indigo-50",
    },
    USER_PROVISIONED_LURAH: {
      title: "Registrasi Akun Lurah",
      desc: "Akun kepemimpinan lurah berhasil dibuat",
      icon: UserPlus,
      tone: "text-purple-600 bg-purple-50",
    },
    USER_PROVISIONED_MASYARAKAT: {
      title: "Registrasi Akun Pengguna",
      desc: "Akun warga baru berhasil dibuat",
      icon: UserPlus,
      tone: "text-emerald-600 bg-emerald-50",
    },
    USER_SET_ROLE_ADMIN_KELURAHAN: {
      title: "Perubahan Peran: Administrator",
      desc: "Pengguna diberikan hak akses penuh administrator kelurahan",
      icon: Shield,
      tone: "text-indigo-600 bg-indigo-50",
    },
    USER_SET_ROLE_LURAH: {
      title: "Perubahan Peran: Lurah",
      desc: "Pengguna diberikan peran kepemimpinan lurah",
      icon: Shield,
      tone: "text-purple-600 bg-purple-50",
    },
    USER_SET_ROLE_MASYARAKAT: {
      title: "Perubahan Peran: Warga",
      desc: "Peran pengguna diubah menjadi warga terdaftar",
      icon: Shield,
      tone: "text-emerald-600 bg-emerald-50",
    },
    USER_SESSION_REVOKED: {
      title: "Pencabutan Sesi Akun",
      desc: "Semua sesi pengguna dicabut oleh administrator",
      icon: KeyRound,
      tone: "text-amber-600 bg-amber-50",
    },
    USER_DEACTIVATED: {
      title: "Penonaktifan Akun",
      desc: "Akun pengguna dinonaktifkan dari sistem",
      icon: AlertTriangle,
      tone: "text-red-600 bg-red-50",
    },
    USER_ACTIVATED: {
      title: "Pengaktifan Akun",
      desc: "Akun pengguna diaktifkan kembali",
      icon: CheckCircle2,
      tone: "text-emerald-600 bg-emerald-50",
    },
    USER_PASSWORD_RESET: {
      title: "Reset Kata Sandi Akun",
      desc: "Kata sandi akun diatur ulang oleh administrator",
      icon: KeyRound,
      tone: "text-indigo-600 bg-indigo-50",
    },
    NEWS_CREATED: {
      title: "Membuat Berita Baru",
      desc: "Draft berita kelurahan ditambahkan",
      icon: FileText,
      tone: "text-blue-600 bg-blue-50",
    },
    NEWS_UPDATED: {
      title: "Memperbarui Berita",
      desc: "Perubahan isi atau data berita",
      icon: FileText,
      tone: "text-blue-600 bg-blue-50",
    },
    NEWS_PUBLISHED: {
      title: "Menerbitkan Berita",
      desc: "Berita kelurahan dipublikasikan ke portal publik",
      icon: FileText,
      tone: "text-emerald-600 bg-emerald-50",
    },
    MEDIA_UPLOADED: {
      title: "Mengunggah Berkas Media",
      desc: "Berkas gambar atau dokumen baru diunggah",
      icon: ImageIcon,
      tone: "text-sky-600 bg-sky-50",
    },
    MEDIA_UPDATED: {
      title: "Memperbarui Berkas Media",
      desc: "Informasi metadata media diperbarui",
      icon: ImageIcon,
      tone: "text-sky-600 bg-sky-50",
    },
    PROFILE_SETTINGS_UPDATED: {
      title: "Memperbarui Pengaturan Website",
      desc: "Identitas kelurahan, kontak, atau tampilan diperbarui",
      icon: Settings,
      tone: "text-purple-600 bg-purple-50",
    },
    PROFILE_PAGE_SAVED: {
      title: "Memperbarui Halaman Profil",
      desc: "Halaman sejarah, visi-misi, atau struktur organisasi diperbarui",
      icon: FileText,
      tone: "text-purple-600 bg-purple-50",
    },
    PROFILE_OFFICIAL_SAVED: {
      title: "Memperbarui Data Aparatur",
      desc: "Informasi jabatan aparatur kelurahan diperbarui",
      icon: UserIcon,
      tone: "text-purple-600 bg-purple-50",
    },
    CONTENT_SAVED: {
      title: "Memperbarui Konten Informasi",
      desc: "Pengumuman, agenda, atau album galeri diperbarui",
      icon: FileText,
      tone: "text-blue-600 bg-blue-50",
    },
    COMMUNITY_SECTION_SAVED: {
      title: "Memperbarui Infografis Kelurahan",
      desc: "Data infografis atau statistik diperbarui",
      icon: Settings,
      tone: "text-indigo-600 bg-indigo-50",
    },
    PUBLIC_REQUEST_RECEIVED: {
      title: "Pesan Warga Diterima",
      desc: "Aspirasi atau pengaduan baru dari masyarakat",
      icon: FileText,
      tone: "text-amber-600 bg-amber-50",
    },
    PUBLIC_REQUEST_UPDATED: {
      title: "Tindak Lanjut Pesan Diperbarui",
      desc: "Status tindak lanjut pesan warga diperbarui",
      icon: CheckCircle2,
      tone: "text-emerald-600 bg-emerald-50",
    },
    CONTACT_CHANGE_APPROVED: {
      title: "Persetujuan Perubahan Kontak",
      desc: "Perubahan kontak email/telepon warga disetujui",
      icon: CheckCircle2,
      tone: "text-emerald-600 bg-emerald-50",
    },
    CONTACT_CHANGE_REJECTED: {
      title: "Penolakan Perubahan Kontak",
      desc: "Pengajuan perubahan kontak warga ditolak",
      icon: AlertTriangle,
      tone: "text-red-600 bg-red-50",
    },
  };

  if (map[action]) return map[action];

  return {
    title: action.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    desc: "Aktivitas pengelolaan sistem",
    icon: FileCode2,
    tone: "text-slate-600 bg-slate-50",
  };
}

function RegisterUserModal({ onClose }: { onClose: () => void }) {
  const runtime = useAuthRuntime();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("ADMIN_KELURAHAN");
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [verified, setVerified] = useState(false);

  const mutation = useMutation({
    mutationFn: async (body: {
      email: string;
      displayName?: string;
      role: string;
      password: string;
      currentPassword: string;
    }) => {
      return await cmsMutate<{ item: User }>(
        runtime.request,
        "/admin/dashboard/users",
        body,
        "POST",
      );
    },
    onSuccess: async () => {
      await runtime.queryClient.invalidateQueries({ queryKey: ["user"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <span>Registrasi Admin / Pengguna Baru</span>
            </h2>
            <p className="text-xs text-slate-500">
              Tambahkan akun pengelola baru dan tentukan hak akses peran dalam sistem.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate({
              email: email.trim().toLowerCase(),
              displayName: displayName.trim() || undefined,
              role,
              password,
              currentPassword: adminPassword,
            });
          }}
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Alamat Email Akun
            </label>
            <input
              className="cms-input"
              type="email"
              required
              maxLength={254}
              placeholder="contoh: staf.kelurahan@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Nama Lengkap / Jabatan (Opsional)
            </label>
            <input
              className="cms-input"
              type="text"
              maxLength={120}
              placeholder="misal: Amirullah, S.Sos (Kasi Pemerintahan)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Peran Akun (Hak Akses)
            </label>
            <select
              className="cms-input font-medium"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="ADMIN_KELURAHAN">
                Administrator Kelurahan — Hak Akses Penuh ke Semua Menu & Pengaturan
              </option>
              <option value="LURAH">
                Lurah — Akses Monitoring Eksekutif, Pelayanan & Publikasi
              </option>
              <option value="MASYARAKAT">
                Warga Terdaftar — Akses Layanan & Aspirasi Mandiri
              </option>
            </select>
            <p className="text-[11px] text-slate-500">
              {role === "ADMIN_KELURAHAN" && (
                <span className="text-indigo-600 font-semibold">
                  Administrator dapat membuka dan mengelola seluruh menu: berita, profil, kotak masuk, wilayah, kanal konten, dan pengguna.
                </span>
              )}
              {role === "LURAH" && (
                <span className="text-purple-600 font-semibold">
                  Lurah dapat meninjau dashboard statistik, pelayanan, dan monitoring publikasi kelurahan.
                </span>
              )}
              {role === "MASYARAKAT" && (
                <span className="text-slate-600">
                  Warga terdaftar untuk mengajukan aspirasi dan layanan mandiri.
                </span>
              )}
            </p>
          </div>

          <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Kata Sandi Akun Baru
            </label>
            <input
              className="cms-input bg-white"
              type="password"
              required
              minLength={12}
              maxLength={72}
              placeholder="Minimal 12 karakter kombinasi kuat..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <p className="text-[11px] text-slate-400">
              Harap berikan kata sandi ini langsung kepada pemilik akun secara aman.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Kata Sandi Administrator Anda
            </label>
            <input
              className="cms-input"
              type="password"
              required
              maxLength={72}
              placeholder="Masukkan kata sandi login admin Anda untuk konfirmasi..."
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span>
              Saya mengonfirmasi pendaftaran akun dan pemberian peran ini secara resmi untuk staf kelurahan.
            </span>
          </label>

          {mutation.isError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle size={15} className="shrink-0 text-red-600" />
              <span>{cmsError(mutation.error)}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !verified}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? (
                <>
                  <RotateCw size={13} className="animate-spin" />
                  <span>Mendaftarkan...</span>
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  <span>Daftarkan Pengguna Baru</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AccessFormModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const runtime = useAuthRuntime();
  const [action, setAction] = useState("REVOKE_SESSIONS");
  const [selectedRole, setSelectedRole] = useState(user.role);
  const roleInfo = formatRole(user.role);

  const mutation = useMutation({
    mutationFn: async (body: {
      action: string;
      identityVerified: boolean;
      currentPassword: string;
      expectedUpdatedAt: string;
      newPassword?: string;
      role?: string;
    }) => {
      try {
        return await cmsMutate(
          runtime.request,
          `/admin/dashboard/users/${user.id}/access`,
          body,
          "POST",
        );
      } finally {
        body.currentPassword = "";
        delete body.newPassword;
      }
    },
    onSuccess: async () => {
      await runtime.queryClient.invalidateQueries({ queryKey: ["user"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              <span>Kelola Akses Pengguna</span>
            </h2>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="font-semibold text-slate-800 text-sm">{user.email}</span>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${roleInfo.badge}`}>
                {roleInfo.label}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (
              !confirm(
                `Konfirmasi tindakan ${action} untuk ${user.email}? Semua sesi aktif akun ini akan dicabut.`,
              )
            )
              return;
            const form = e.currentTarget;
            const f = new FormData(form);
            const body = {
              action,
              identityVerified: f.get("verified") === "on",
              currentPassword: String(f.get("password")),
              expectedUpdatedAt: user.updatedAt,
              ...(action === "RESET_PASSWORD"
                ? { newPassword: String(f.get("newPassword")) }
                : {}),
              ...(action === "SET_ROLE" ? { role: selectedRole } : {}),
            };
            form.reset();
            mutation.mutate(body);
          }}
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Pilihan Tindakan Akses
            </label>
            <select
              className="cms-input font-medium"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              <option value="REVOKE_SESSIONS">Cabut semua sesi aktif (Logout paksa)</option>
              <option value="SET_ROLE">Ubah Peran Akun (Role: Admin / Lurah / Warga)</option>
              <option value={user.isActive ? "DEACTIVATE" : "ACTIVATE"}>
                {user.isActive ? "Nonaktifkan akun pengguna" : "Aktifkan kembali akun"}
              </option>
              <option value="RESET_PASSWORD">Reset kata sandi pengguna</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Setiap tindakan secara otomatis mencabut seluruh sesi login aktif pengguna tersebut.
            </p>
          </div>

          {action === "SET_ROLE" && (
            <div className="space-y-2 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Pilih Peran Baru (Role)
              </label>
              <select
                className="cms-input bg-white font-medium"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="ADMIN_KELURAHAN">
                  Administrator Kelurahan — Hak Akses Penuh Semua Menu
                </option>
                <option value="LURAH">
                  Lurah — Akses Monitoring Eksekutif & Pelayanan
                </option>
                <option value="MASYARAKAT">
                  Warga Terdaftar — Akses Layanan Publik Mandiri
                </option>
              </select>
              <p className="text-[11px] text-slate-600">
                Administrator memiliki kewenangan tertinggi membuka dan mengelola seluruh modul CMS, profil kelurahan, kotak masuk, berita, dan pengguna.
              </p>
            </div>
          )}

          {action === "RESET_PASSWORD" && (
            <div className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Kata Sandi Baru Akun
              </label>
              <input
                className="cms-input bg-white"
                name="newPassword"
                type="password"
                required
                minLength={12}
                maxLength={72}
                placeholder="Minimal 12 karakter kombinasi kuat..."
                autoComplete="new-password"
              />
              <p className="text-[11px] text-slate-500">
                Sampaikan kata sandi baru secara langsung/pribadi kepada pemilik akun. Sistem tidak mengirim email kata sandi otomatis.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Kata Sandi Administrator Anda
            </label>
            <input
              className="cms-input"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={72}
              placeholder="Masukkan kata sandi login admin Anda untuk konfirmasi..."
            />
          </div>

          <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 cursor-pointer">
            <input type="checkbox" name="verified" required className="mt-0.5 rounded border-slate-300 text-primary focus:ring-primary" />
            <span>
              Saya telah memverifikasi identitas pemilik akun dan memastikan permintaan perubahan ini sah.
            </span>
          </label>

          {mutation.isError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle size={15} className="shrink-0 text-red-600" />
              <span>{cmsError(mutation.error)}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? (
                <>
                  <RotateCw size={13} className="animate-spin" />
                  <span>Memproses Perubahan...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  <span>Konfirmasi Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Management() {
  const runtime = useAuthRuntime();
  const auth = useAuth();
  const [tab, setTab] = useState<"users" | "audit" | "uploads">("users");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const query = useQuery({
    queryKey: ["user", auth.user?.id, "management", tab, page, search],
    queryFn: () =>
      runtime.request<List<User | Audit | Upload> & Partial<Uploads>>(
        `/admin/dashboard/${tab}?page=${page}&limit=10&search=${encodeURIComponent(search)}`,
      ),
    staleTime: 0,
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {tab === "users"
              ? "Daftar Pengguna Sistem"
              : tab === "audit"
                ? "Riwayat Aktivitas & Log Audit"
                : "Penggunaan Penyimpanan Berkas"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {tab === "users"
              ? "Kelola status dan hak akses akun administrator, lurah, dan warga kelurahan."
              : tab === "audit"
                ? "Log aktivitas terenkripsi dan riwayat perubahan data oleh pengelola."
                : "Daftar berkas media dan lampiran publik yang tersimpan di server."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsRegisterOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
          >
            <UserPlus size={14} />
            <span>Registrasi Admin / Pengguna</span>
          </button>

          <Link
            href="/admin/verifikasi-kontak"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <UserCheck size={14} className="text-primary" />
            <span>Verifikasi Kontak Warga</span>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6">
        {(
          [
            ["users", "Daftar Pengguna", Users],
            ["audit", "Riwayat Aktivitas", History],
            ["uploads", "Penyimpanan Berkas", HardDrive],
          ] as const
        ).map(([key, label, Icon]) => {
          const isActive = tab === key;
          return (
            <button
              key={key}
              aria-pressed={isActive}
              onClick={() => {
                setTab(key);
                setPage(1);
                setSearch("");
                setSelectedUser(null);
              }}
              className={`pb-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Quota Cards for Uploads Tab */}
      {tab === "uploads" && query.data?.quota && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Berkas Tersimpan
            </span>
            <div className="text-2xl font-black text-slate-900">
              {(query.data.quota.physicalBytes / (1024 * 1024)).toFixed(1)}{" "}
              <span className="text-xs font-semibold text-slate-500">MB</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Ukuran fisik seluruh gambar dan dokumen di server
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Batas Ukuran Berkas
            </span>
            <div className="text-2xl font-black text-slate-900">
              {Math.round(query.data.quota.perFileBytes / (1024 * 1024))}{" "}
              <span className="text-xs font-semibold text-slate-500">MB / file</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Maksimum per berkas gambar JPG, PNG, WebP & PDF
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Proses Simultan
            </span>
            <div className="text-2xl font-black text-slate-900">
              {query.data.quota.concurrentUploads}{" "}
              <span className="text-xs font-semibold text-slate-500">Proses</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Kapasitas unggahan bersamaan untuk stabilitas server
            </p>
          </div>
        </div>
      )}

      {/* Notice info on Users Tab */}
      {tab === "users" && (
        <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-xs text-indigo-900">
          <ShieldCheck size={18} className="shrink-0 text-indigo-600" />
          <span>
            Administrator memiliki kewenangan penuh membuka dan mengelola seluruh fitur di dalam website kelurahan. Anda dapat mendaftarkan akun administrator/lurah baru atau menyesuaikan peran pengguna yang ada melalui tombol <strong>Kelola Akses</strong>.
          </span>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            className="cms-input pl-9 text-xs"
            placeholder={
              tab === "users"
                ? "Cari pengguna berdasarkan alamat email..."
                : tab === "audit"
                  ? "Cari riwayat aktivitas / aksi..."
                  : "Cari nama berkas..."
            }
            value={search}
            maxLength={100}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => void query.refetch()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RotateCw size={13} className={query.isFetching ? "animate-spin text-primary" : ""} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Register User Modal */}
      {isRegisterOpen && (
        <RegisterUserModal onClose={() => setIsRegisterOpen(false)} />
      )}

      {/* Access Form Modal */}
      {selectedUser && (
        <AccessFormModal
          key={selectedUser.id}
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

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
              description="Tidak ada data yang cocok dengan kriteria pencarian Anda. Silakan coba kata kunci lain."
            />
          ) : (
            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
              {/* TAB 1: USERS LIST */}
              {tab === "users" && (
                <div className="divide-y divide-slate-100">
                  {query.data.items.map((item) => {
                    if (!("email" in item)) return null;
                    const roleInfo = formatRole(item.role);
                    const isSelf = item.id === auth.user?.id;
                    const initialLetter = item.email.charAt(0).toUpperCase();

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-3 hover:bg-slate-50/60 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-bold text-sm text-white ${
                            item.role === "ADMIN_KELURAHAN"
                              ? "bg-indigo-600"
                              : item.role === "LURAH"
                                ? "bg-purple-600"
                                : "bg-emerald-600"
                          }`}>
                            {initialLetter}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm truncate">
                                {item.email}
                              </span>
                              {isSelf && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                  Akun Anda
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${roleInfo.badge}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${roleInfo.dot}`} />
                                {roleInfo.label}
                              </span>

                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                item.isActive
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${item.isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                                {item.isActive ? "Aktif" : "Nonaktif"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {isSelf ? (
                            <span className="text-xs text-slate-400 font-medium px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                              Akun Sendiri
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedUser(item)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
                            >
                              <KeyRound size={13} className="text-primary" />
                              <span>Kelola Akses & Peran</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: AUDIT LOGS */}
              {tab === "audit" && (
                <div className="divide-y divide-slate-100">
                  {query.data.items.map((item) => {
                    if (!("action" in item)) return null;
                    const meta = humanAction(item.action);
                    const ActionIcon = meta.icon;
                    const formattedDate = new Date(item.createdAt).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-3 hover:bg-slate-50/60 transition-colors"
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${meta.tone}`}>
                            <ActionIcon size={18} />
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm">
                                {meta.title}
                              </span>
                              {item.resourceType && (
                                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                  {item.resourceType}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500">
                              {meta.desc} · Pelaku: <span className="font-semibold text-slate-700">{item.actorId ? "Administrator" : "Sistem"}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-xs text-slate-400 font-medium self-end sm:self-auto shrink-0">
                          <time dateTime={item.createdAt}>{formattedDate}</time>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 3: UPLOADS LIST */}
              {tab === "uploads" && (
                <div className="divide-y divide-slate-100">
                  {query.data.items.map((item) => {
                    if (!("originalName" in item)) return null;
                    const isImage = /\.(jpe?g|png|webp|gif|svg)$/i.test(item.originalName);
                    const sizeInMb = (item.size / (1024 * 1024)).toFixed(2);
                    const sizeInKb = Math.round(item.size / 1024);
                    const sizeText = item.size >= 1024 * 1024 ? `${sizeInMb} MB` : `${sizeInKb} KB`;
                    const fileUrl = `/api/v1/public/media/${item.id}`;

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-3 hover:bg-slate-50/60 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 grid place-items-center">
                            {isImage ? (
                              <Image
                                src={fileUrl}
                                alt={item.originalName}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            ) : (
                              <FileText size={20} className="text-slate-400" />
                            )}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <p className="font-bold text-slate-900 text-sm truncate" title={item.originalName}>
                              {item.originalName}
                            </p>

                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-slate-500">
                                {sizeText}
                              </span>
                              <span>·</span>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                item.visibility === "PUBLIC"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}>
                                {item.visibility === "PUBLIC" ? "Publik" : "Privat"}
                              </span>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                item.archived
                                  ? "bg-slate-100 text-slate-600 border border-slate-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}>
                                {item.archived ? "Arsip" : "Aktif"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
                          >
                            <ExternalLink size={13} />
                            <span>Buka Berkas</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <AdminPagination
            page={page}
            total={query.data.total}
            limit={10}
            onPageChange={setPage}
            itemName="data"
          />
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <main className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Pengguna & Keamanan Sistem"
        description="Kelola hak akses administrator, registrasi pengelola baru, pantau riwayat log aktivitas, dan pantau pemakaian berkas."
        icon={Users}
      />
      <AdminAccess>
        <Management />
      </AdminAccess>
    </main>
  );
}
