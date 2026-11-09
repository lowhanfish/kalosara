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
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Check,
  Filter,
} from "lucide-react";
import { AdminEmptyState, AdminLoading, AdminError } from "@/components/admin/feedback";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/pagination";
import { UsersShieldSvg } from "@/components/admin/admin-icons";
import { AdminAccess } from "@/features/cms/admin-access";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsError, cmsMutate, type List } from "@/features/cms/client";

type User = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  updatedAt: string;
  createdAt?: string;
  profile?: { displayName: string | null } | null;
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
  createdAt?: string;
};

type QueryItem = User | Audit | Upload;

function isUser(item: QueryItem): item is User {
  return "email" in item;
}

function isAudit(item: QueryItem): item is Audit {
  return "action" in item;
}

function isUpload(item: QueryItem): item is Upload {
  return "originalName" in item;
}

type ManagementResponse = {
  items: QueryItem[];
  total: number;
  page: number;
  limit: number;
  counts?: {
    total: number;
    admin: number;
    lurah: number;
    masyarakat: number;
  };
  quota?: {
    perFileBytes: number;
    physicalBytes: number;
    concurrentUploads: number;
    totalLimitBytes: null;
  };
};

function generateSecurePassword(length = 16): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*+";
  let pass = "";
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const values = new Uint32Array(length);
    window.crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      pass += chars[values[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return pass;
}

function CopyButton({ text, label = "Salin" }: { text: string; label?: string }) {
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
          // ignore clipboard errors
        }
      }}
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors"
      title="Salin tautan ke clipboard"
    >
      {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
      <span>{copied ? "Tersalin!" : label}</span>
    </button>
  );
}

function formatRole(role: string) {
  switch (role) {
    case "ADMIN_KELURAHAN":
      return {
        label: "Administrator",
        subtitle: "Akses Penuh Semua Modul",
        badge: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
        dot: "bg-indigo-500",
        gradient: "from-indigo-600 to-blue-700",
      };
    case "LURAH":
      return {
        label: "Lurah",
        subtitle: "Akses Monitoring Eksekutif",
        badge: "bg-purple-50 text-purple-700 border-purple-200/80",
        dot: "bg-purple-500",
        gradient: "from-purple-600 to-indigo-700",
      };
    case "MASYARAKAT":
      return {
        label: "Warga Terdaftar",
        subtitle: "Akses Layanan Publik Mandiri",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        dot: "bg-emerald-500",
        gradient: "from-emerald-600 to-teal-700",
      };
    default:
      return {
        label: role.toLowerCase().replace(/_/g, " "),
        subtitle: "Pengguna Terdaftar",
        badge: "bg-slate-100 text-slate-700 border-slate-200",
        dot: "bg-slate-400",
        gradient: "from-slate-600 to-slate-700",
      };
  }
}

function humanAction(action: string): { title: string; desc: string; icon: typeof FileText; tone: string } {
  const map: Record<string, { title: string; desc: string; icon: typeof FileText; tone: string }> = {
    AUTH_LOGIN: {
      title: "Pengguna Masuk Akun",
      desc: "Autentikasi sesi berhasil dilakukan",
      icon: Lock,
      tone: "text-emerald-600 bg-emerald-50 border border-emerald-200/60",
    },
    AUTH_LOGOUT: {
      title: "Pengguna Keluar Akun",
      desc: "Sesi login ditutup dengan aman",
      icon: Lock,
      tone: "text-slate-600 bg-slate-50 border border-slate-200/60",
    },
    USER_PROVISIONED_ADMIN_KELURAHAN: {
      title: "Registrasi Administrator Baru",
      desc: "Akun administrator baru berhasil dibuat dengan hak akses penuh",
      icon: UserPlus,
      tone: "text-indigo-600 bg-indigo-50 border border-indigo-200/60",
    },
    USER_PROVISIONED_LURAH: {
      title: "Registrasi Akun Lurah",
      desc: "Akun kepemimpinan lurah berhasil dibuat",
      icon: UserPlus,
      tone: "text-purple-600 bg-purple-50 border border-purple-200/60",
    },
    USER_PROVISIONED_MASYARAKAT: {
      title: "Registrasi Akun Pengguna",
      desc: "Akun warga baru berhasil dibuat",
      icon: UserPlus,
      tone: "text-emerald-600 bg-emerald-50 border border-emerald-200/60",
    },
    USER_SET_ROLE_ADMIN_KELURAHAN: {
      title: "Perubahan Peran: Administrator",
      desc: "Pengguna diberikan hak akses penuh administrator kelurahan",
      icon: Shield,
      tone: "text-indigo-600 bg-indigo-50 border border-indigo-200/60",
    },
    USER_SET_ROLE_LURAH: {
      title: "Perubahan Peran: Lurah",
      desc: "Pengguna diberikan peran kepemimpinan lurah",
      icon: Shield,
      tone: "text-purple-600 bg-purple-50 border border-purple-200/60",
    },
    USER_SET_ROLE_MASYARAKAT: {
      title: "Perubahan Peran: Warga",
      desc: "Peran pengguna diubah menjadi warga terdaftar",
      icon: Shield,
      tone: "text-emerald-600 bg-emerald-50 border border-emerald-200/60",
    },
    USER_SESSION_REVOKED: {
      title: "Pencabutan Sesi Akun",
      desc: "Semua sesi pengguna dicabut oleh administrator",
      icon: KeyRound,
      tone: "text-amber-600 bg-amber-50 border border-amber-200/60",
    },
    USER_DEACTIVATED: {
      title: "Penonaktifan Akun",
      desc: "Akun pengguna dinonaktifkan dari sistem",
      icon: AlertTriangle,
      tone: "text-red-600 bg-red-50 border border-red-200/60",
    },
    USER_ACTIVATED: {
      title: "Pengaktifan Akun",
      desc: "Akun pengguna diaktifkan kembali",
      icon: CheckCircle2,
      tone: "text-emerald-600 bg-emerald-50 border border-emerald-200/60",
    },
    USER_PASSWORD_RESET: {
      title: "Reset Kata Sandi Akun",
      desc: "Kata sandi akun diatur ulang oleh administrator",
      icon: KeyRound,
      tone: "text-indigo-600 bg-indigo-50 border border-indigo-200/60",
    },
    NEWS_CREATED: {
      title: "Membuat Berita Baru",
      desc: "Draft berita kelurahan ditambahkan",
      icon: FileText,
      tone: "text-blue-600 bg-blue-50 border border-blue-200/60",
    },
    NEWS_UPDATED: {
      title: "Memperbarui Berita",
      desc: "Perubahan isi atau data berita",
      icon: FileText,
      tone: "text-blue-600 bg-blue-50 border border-blue-200/60",
    },
    NEWS_PUBLISHED: {
      title: "Menerbitkan Berita",
      desc: "Berita kelurahan dipublikasikan ke portal publik",
      icon: FileText,
      tone: "text-emerald-600 bg-emerald-50 border border-emerald-200/60",
    },
    MEDIA_UPLOADED: {
      title: "Mengunggah Berkas Media",
      desc: "Berkas gambar atau dokumen baru diunggah",
      icon: ImageIcon,
      tone: "text-sky-600 bg-sky-50 border border-sky-200/60",
    },
    MEDIA_UPDATED: {
      title: "Memperbarui Berkas Media",
      desc: "Informasi metadata media diperbarui",
      icon: ImageIcon,
      tone: "text-sky-600 bg-sky-50 border border-sky-200/60",
    },
    PROFILE_SETTINGS_UPDATED: {
      title: "Memperbarui Pengaturan Website",
      desc: "Identitas kelurahan, kontak, atau tampilan diperbarui",
      icon: Settings,
      tone: "text-purple-600 bg-purple-50 border border-purple-200/60",
    },
    PROFILE_PAGE_SAVED: {
      title: "Memperbarui Halaman Profil",
      desc: "Halaman sejarah, visi-misi, atau struktur organisasi diperbarui",
      icon: FileText,
      tone: "text-purple-600 bg-purple-50 border border-purple-200/60",
    },
    PROFILE_OFFICIAL_SAVED: {
      title: "Memperbarui Data Aparatur",
      desc: "Informasi jabatan aparatur kelurahan diperbarui",
      icon: UserIcon,
      tone: "text-purple-600 bg-purple-50 border border-purple-200/60",
    },
    CONTENT_SAVED: {
      title: "Memperbarui Konten Informasi",
      desc: "Pengumuman, agenda, atau album galeri diperbarui",
      icon: FileText,
      tone: "text-blue-600 bg-blue-50 border border-blue-200/60",
    },
    COMMUNITY_SECTION_SAVED: {
      title: "Memperbarui Infografis Kelurahan",
      desc: "Data infografis atau statistik diperbarui",
      icon: Settings,
      tone: "text-indigo-600 bg-indigo-50 border border-indigo-200/60",
    },
    PUBLIC_REQUEST_RECEIVED: {
      title: "Pesan Warga Diterima",
      desc: "Aspirasi atau pengaduan baru dari masyarakat",
      icon: FileText,
      tone: "text-amber-600 bg-amber-50 border border-amber-200/60",
    },
    PUBLIC_REQUEST_UPDATED: {
      title: "Tindak Lanjut Pesan Diperbarui",
      desc: "Status tindak lanjut pesan warga diperbarui",
      icon: CheckCircle2,
      tone: "text-emerald-600 bg-emerald-50 border border-emerald-200/60",
    },
    CONTACT_CHANGE_APPROVED: {
      title: "Persetujuan Perubahan Kontak",
      desc: "Perubahan kontak email/telepon warga disetujui",
      icon: CheckCircle2,
      tone: "text-emerald-600 bg-emerald-50 border border-emerald-200/60",
    },
    CONTACT_CHANGE_REJECTED: {
      title: "Penolakan Perubahan Kontak",
      desc: "Pengajuan perubahan kontak warga ditolak",
      icon: AlertTriangle,
      tone: "text-red-600 bg-red-50 border border-red-200/60",
    },
  };

  if (map[action]) return map[action];

  return {
    title: action.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    desc: "Aktivitas pengelolaan sistem",
    icon: FileCode2,
    tone: "text-slate-600 bg-slate-50 border border-slate-200/60",
  };
}

function RegisterUserModal({ onClose }: { onClose: () => void }) {
  const runtime = useAuthRuntime();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("ADMIN_KELURAHAN");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
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

  const handleRandomPassword = () => {
    const p = generateSecurePassword(16);
    setPassword(p);
    setShowPassword(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <UserPlus className="h-4 w-4" />
              </div>
              <span>Registrasi Admin / Pengguna Baru</span>
            </h2>
            <p className="text-xs text-slate-500">
              Buat akun pengguna baru dan tentukan hak akses peran dalam sistem portal kelurahan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form
          className="space-y-5"
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
          {/* Email & Name */}
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Alamat Email Akun <span className="text-red-500">*</span>
              </label>
              <input
                className="cms-input"
                type="email"
                required
                maxLength={254}
                placeholder="misal: staf.kelurahan@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Nama Lengkap & Gelar (Opsional)
              </label>
              <input
                className="cms-input"
                type="text"
                maxLength={120}
                placeholder="misal: Drs. Amirullah (Kasi Pemerintahan)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          </div>

          {/* Role Selection Cards */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Peran Akun & Hak Akses <span className="text-red-500">*</span>
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                {
                  id: "ADMIN_KELURAHAN",
                  title: "Administrator",
                  desc: "Akses Penuh Semua Modul & Kelola Akun",
                  color: "border-indigo-200 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500",
                  idle: "border-slate-200 hover:border-slate-300 bg-white",
                },
                {
                  id: "LURAH",
                  title: "Lurah",
                  desc: "Akses Monitoring Eksekutif & Pelayanan",
                  color: "border-purple-200 bg-purple-50/70 text-purple-900 ring-2 ring-purple-500",
                  idle: "border-slate-200 hover:border-slate-300 bg-white",
                },
                {
                  id: "MASYARAKAT",
                  title: "Warga",
                  desc: "Aspirasi & Layanan Publik Mandiri",
                  color: "border-emerald-200 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500",
                  idle: "border-slate-200 hover:border-slate-300 bg-white",
                },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setRole(item.id)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    role === item.id ? item.color : item.idle
                  }`}
                >
                  <p className="text-xs font-bold">{item.title}</p>
                  <p className="text-[10px] text-slate-500 leading-tight mt-1">{item.desc}</p>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 pt-0.5">
              {role === "ADMIN_KELURAHAN" && (
                <span className="text-indigo-600 font-medium">
                  Administrator memiliki wewenang tertinggi: membuka semua halaman berita, infografis, profil, kotak masuk aspirasi, wilayah, dan pengguna.
                </span>
              )}
              {role === "LURAH" && (
                <span className="text-purple-600 font-medium">
                  Lurah memiliki akses eksekutif untuk meninjau rekapan statistik, permohonan informasi PPID, dan evaluasi pelayanan.
                </span>
              )}
              {role === "MASYARAKAT" && (
                <span className="text-emerald-600 font-medium">
                  Akun warga terdaftar untuk menyampaikan aspirasi dan permohonan informasi mandiri.
                </span>
              )}
            </p>
          </div>

          {/* Password for New User */}
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Kata Sandi Baru <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleRandomPassword}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition-colors"
              >
                <Sparkles size={11} />
                <span>Acak Sandi Kuat</span>
              </button>
            </div>
            <div className="relative">
              <input
                className="cms-input bg-white pr-10"
                type={showPassword ? "text" : "password"}
                required
                minLength={12}
                maxLength={72}
                placeholder="Minimal 12 karakter..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Harap berikan kata sandi ini langsung kepada pemilik akun secara aman.
            </p>
          </div>

          {/* Admin Password Re-auth */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Kata Sandi Administrator Anda <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                className="cms-input pr-10"
                type={showAdminPassword ? "text" : "password"}
                required
                maxLength={72}
                placeholder="Masukkan kata sandi login admin Anda untuk konfirmasi..."
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowAdminPassword(!showAdminPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Consent Checkbox */}
          <label className="flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span>
              Saya mengonfirmasi pendaftaran akun dan pemberian peran hak akses ini secara sah sesuai ketentuan kelurahan.
            </span>
          </label>

          {mutation.isError && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle size={15} className="shrink-0 text-red-600" />
              <span>{cmsError(mutation.error)}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-blue-100/70">
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={onClose}
              className="glass-button-secondary px-4 py-2.5 text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !verified}
              className="glass-button-primary px-5 py-2.5 text-xs disabled:opacity-50"
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
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [verified, setVerified] = useState(false);
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

  const handleRandomPassword = () => {
    const p = generateSecurePassword(16);
    setNewPassword(p);
    setShowNewPassword(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <KeyRound className="h-4 w-4" />
              </div>
              <span>Kelola Akses & Peran Pengguna</span>
            </h2>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="font-bold text-slate-900 text-sm">{user.email}</span>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${roleInfo.badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${roleInfo.dot}`} />
                {roleInfo.label}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                user.isActive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}>
                {user.isActive ? "Aktif" : "Nonaktif"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate({
              action,
              identityVerified: verified,
              currentPassword: adminPassword,
              expectedUpdatedAt: user.updatedAt,
              ...(action === "RESET_PASSWORD" ? { newPassword } : {}),
              ...(action === "SET_ROLE" ? { role: selectedRole } : {}),
            });
          }}
        >
          {/* Action Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Pilihan Tindakan Akses
            </label>
            <select
              className="cms-input font-medium"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              <option value="SET_ROLE">Ubah Peran Akun (Role: Administrator / Lurah / Warga)</option>
              <option value="REVOKE_SESSIONS">Cabut Semua Sesi Aktif (Logout Paksa)</option>
              <option value={user.isActive ? "DEACTIVATE" : "ACTIVATE"}>
                {user.isActive ? "Nonaktifkan Akun Pengguna" : "Aktifkan Kembali Akun Pengguna"}
              </option>
              <option value="RESET_PASSWORD">Reset Kata Sandi Akun</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Setiap tindakan secara otomatis mencabut seluruh sesi login aktif akun untuk menjamin keamanan.
            </p>
          </div>

          {/* Change Role Card Options */}
          {action === "SET_ROLE" && (
            <div className="space-y-2.5 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Pilih Peran Baru (Role)
              </label>
              <div className="grid gap-2">
                {[
                  {
                    id: "ADMIN_KELURAHAN",
                    title: "Administrator Kelurahan",
                    desc: "Wewenang penuh membuka dan mengelola seluruh fitur: berita, profil, kotak masuk, wilayah, dan pengguna.",
                  },
                  {
                    id: "LURAH",
                    title: "Lurah (Pimpinan)",
                    desc: "Akses monitoring eksekutif terhadap data pelayanan, permohonan informasi publik, dan statistik.",
                  },
                  {
                    id: "MASYARAKAT",
                    title: "Warga Terdaftar",
                    desc: "Akun masyarakat untuk mengajukan aspirasi dan layanan mandiri.",
                  },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedRole === item.id
                        ? "bg-white border-indigo-400 shadow-xs"
                        : "bg-white/60 border-slate-200 hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={item.id}
                      checked={selectedRole === item.id}
                      onChange={() => setSelectedRole(item.id)}
                      className="mt-1 text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.title}</p>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Reset Password Fields */}
          {action === "RESET_PASSWORD" && (
            <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Kata Sandi Baru Akun <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleRandomPassword}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-100 hover:bg-amber-200/80 px-2 py-0.5 rounded-lg transition-colors"
                >
                  <Sparkles size={11} />
                  <span>Acak Sandi Kuat</span>
                </button>
              </div>
              <div className="relative">
                <input
                  className="cms-input bg-white pr-10"
                  type={showNewPassword ? "text" : "password"}
                  required
                  minLength={12}
                  maxLength={72}
                  placeholder="Minimal 12 karakter kombinasi kuat..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Sampaikan kata sandi baru secara langsung/pribadi kepada pemilik akun.
              </p>
            </div>
          )}

          {/* Admin Password Re-auth */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Kata Sandi Administrator Anda <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                className="cms-input pr-10"
                type={showAdminPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                maxLength={72}
                placeholder="Masukkan kata sandi login admin Anda untuk konfirmasi..."
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowAdminPassword(!showAdminPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Safety Checkbox */}
          <label className="flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span>
              Saya telah memverifikasi identitas pemilik akun dan memastikan tindakan akses ini sah.
            </span>
          </label>

          {mutation.isError && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle size={15} className="shrink-0 text-red-600" />
              <span>{cmsError(mutation.error)}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-blue-100/70">
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={onClose}
              className="glass-button-secondary px-4 py-2.5 text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !verified}
              className="glass-button-primary px-5 py-2.5 text-xs disabled:opacity-50"
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
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const queryUrl =
    tab === "users"
      ? `/admin/dashboard/users?page=${page}&limit=10&search=${encodeURIComponent(search)}${
          roleFilter !== "ALL" ? `&role=${roleFilter}` : ""
        }`
      : tab === "audit"
        ? `/admin/dashboard/audit?page=${page}&limit=10&search=${encodeURIComponent(search)}`
        : `/admin/dashboard/uploads?page=${page}&limit=10&search=${encodeURIComponent(search)}`;

  const query = useQuery({
    queryKey: ["user", auth.user?.id, "management", tab, page, search, roleFilter],
    queryFn: () =>
      runtime.request<ManagementResponse>(queryUrl),
    staleTime: 0,
  });

  const counts = query.data?.counts;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
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
          <button
            type="button"
            onClick={() => setIsRegisterOpen(true)}
            className="glass-button-primary px-4 py-2.5 text-xs"
          >
            <UserPlus size={15} />
            <span>+ Registrasi Pengguna / Admin</span>
          </button>

          <Link
            href="/admin/verifikasi-kontak"
            className="glass-button-secondary px-3.5 py-2.5 text-xs"
          >
            <UserCheck size={15} className="text-blue-600" />
            <span>Verifikasi Kontak Warga</span>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="cms-channel-tabs" role="tablist" aria-label="Menu pengguna dan audit">
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
              <Icon size={16} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Summary Metrics Cards for Users Tab */}
      {tab === "users" && counts && (
        <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
          <div
            onClick={() => {
              setRoleFilter("ALL");
              setPage(1);
            }}
            className={`glass-card p-5 cursor-pointer transition-all ${
              roleFilter === "ALL"
                ? "ring-2 ring-blue-500 border-blue-400"
                : "hover:border-blue-300"
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Akun</span>
              <div className="glass-icon-box size-9 rounded-xl">
                <Users size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{counts.total}</div>
            <p className="text-[11px] text-slate-500 mt-1">Semua pengguna terdaftar</p>
          </div>

          <div
            onClick={() => {
              setRoleFilter("ADMIN_KELURAHAN");
              setPage(1);
            }}
            className={`glass-card p-5 cursor-pointer transition-all ${
              roleFilter === "ADMIN_KELURAHAN"
                ? "ring-2 ring-blue-600 border-blue-400"
                : "hover:border-blue-300"
            }`}
          >
            <div className="flex items-center justify-between text-blue-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Administrator
              </span>
              <div className="glass-icon-box size-9 rounded-xl">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{counts.admin}</div>
            <p className="text-[11px] text-blue-600 font-semibold mt-1">Akses penuh sistem</p>
          </div>

          <div
            onClick={() => {
              setRoleFilter("LURAH");
              setPage(1);
            }}
            className={`glass-card p-5 cursor-pointer transition-all ${
              roleFilter === "LURAH"
                ? "ring-2 ring-indigo-500 border-indigo-400"
                : "hover:border-blue-300"
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
            <div className="text-2xl font-black text-slate-900">{counts.lurah}</div>
            <p className="text-[11px] text-indigo-600 font-semibold mt-1">Akses monitoring</p>
          </div>

          <div
            onClick={() => {
              setRoleFilter("MASYARAKAT");
              setPage(1);
            }}
            className={`glass-card p-5 cursor-pointer transition-all ${
              roleFilter === "MASYARAKAT"
                ? "ring-2 ring-emerald-500 border-emerald-400"
                : "hover:border-blue-300"
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
            <div className="text-2xl font-black text-slate-900">{counts.masyarakat}</div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Layanan mandiri</p>
          </div>
        </div>
      )}

      {/* Quota Cards for Uploads Tab */}
      {tab === "uploads" && query.data?.quota && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="glass-card p-5 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Total Berkas Tersimpan
            </span>
            <div className="text-2xl font-black text-slate-900">
              {(query.data.quota.physicalBytes / (1024 * 1024)).toFixed(1)}{" "}
              <span className="text-xs font-semibold text-slate-500">MB</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Ukuran fisik seluruh gambar dan dokumen di server kelurahan
            </p>
          </div>

          <div className="glass-card p-5 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Batas Ukuran Berkas
            </span>
            <div className="text-2xl font-black text-slate-900">
              {Math.round(query.data.quota.perFileBytes / (1024 * 1024))}{" "}
              <span className="text-xs font-semibold text-slate-500">MB / file</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Maksimum per berkas gambar JPG, PNG, WebP & PDF
            </p>
          </div>

          <div className="glass-card p-5 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Proses Simultan
            </span>
            <div className="text-2xl font-black text-slate-900">
              {query.data.quota.concurrentUploads}{" "}
              <span className="text-xs font-semibold text-slate-500">Proses</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Kapasitas unggahan bersamaan untuk stabilitas server
            </p>
          </div>
        </div>
      )}

      {/* Role notice banner on Users Tab */}
      {tab === "users" && (
        <div className="glass-card flex items-start gap-3.5 p-4 text-xs text-blue-950 border-blue-200/80 bg-blue-50/70">
          <div className="glass-icon-box size-9 rounded-xl shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div className="space-y-0.5">
            <span className="font-extrabold text-blue-900">Kewenangan Penuh Administrator Kelurahan:</span>
            <p className="text-blue-900/85 leading-relaxed">
              Sebagai Administrator Kelurahan, Anda memiliki akses penuh membuka dan mengelola seluruh fitur: berita, profil, kotak masuk, wilayah, kanal konten, dan pengguna. Anda dapat mendaftarkan akun pengelola baru melalui tombol <strong>+ Registrasi Pengguna / Admin</strong> atau mengubah peran akun melalui <strong>Kelola Akses & Peran</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="glass-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2.5 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="cms-input pl-10 pr-9 text-xs"
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
                <option value="ADMIN_KELURAHAN">Administrator</option>
                <option value="LURAH">Lurah</option>
                <option value="MASYARAKAT">Warga</option>
              </select>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => void query.refetch()}
          className="glass-button-secondary px-3.5 py-2 text-xs self-start sm:self-auto"
        >
          <RotateCw size={13} className={query.isFetching ? "animate-spin text-blue-600" : ""} />
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
              description="Tidak ada data yang cocok dengan kriteria pencarian Anda. Silakan coba kata kunci atau filter lain."
            />
          ) : (
            <div className="space-y-3">
              {/* TAB 1: USERS LIST */}
              {tab === "users" && (
                <div className="space-y-3">
                  {query.data.items.map((item) => {
                    if (!isUser(item)) return null;
                    const roleInfo = formatRole(item.role);
                    const isSelf = item.id === auth.user?.id;
                    const initialLetter = (item.profile?.displayName || item.email).charAt(0).toUpperCase();
                    const formattedDate = item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : null;

                    return (
                      <div
                        key={item.id}
                        className="glass-list-card flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-3"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-black text-base text-white bg-gradient-to-br ${roleInfo.gradient} shadow-sm`}>
                            {initialLetter}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.profile?.displayName ? (
                                <>
                                  <span className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                                    {item.profile.displayName}
                                  </span>
                                  <span className="text-xs text-slate-500 font-semibold truncate">
                                    ({item.email})
                                  </span>
                                </>
                              ) : (
                                <span className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                                  {item.email}
                                </span>
                              )}

                              {isSelf && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                                  Akun Anda
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${roleInfo.badge}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${roleInfo.dot}`} />
                                {roleInfo.label}
                              </span>

                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                item.isActive
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${item.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                                {item.isActive ? "Aktif" : "Nonaktif"}
                              </span>

                              {formattedDate && (
                                <span className="text-[11px] text-slate-500">
                                  Terdaftar: {formattedDate}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          {isSelf ? (
                            <span className="text-xs text-blue-700 font-bold px-3.5 py-2 bg-blue-50/80 rounded-xl border border-blue-200/80">
                              Akun Sedang Digunakan
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedUser(item)}
                              className="glass-button-secondary px-3.5 py-2 text-xs"
                            >
                              <KeyRound size={13} className="text-blue-600" />
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
                <div className="space-y-3">
                  {query.data.items.map((item) => {
                    if (!isAudit(item)) return null;
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
                        className="glass-list-card flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-3"
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${meta.tone}`}>
                            <ActionIcon size={19} strokeWidth={2} />
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-slate-900 text-sm">
                                {meta.title}
                              </span>
                              {item.resourceType && (
                                <span className="inline-flex items-center rounded-lg border border-blue-200/70 bg-blue-50/80 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                  {item.resourceType}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500">
                              {meta.desc} · Pelaku: <span className="font-bold text-slate-700">{item.actorId ? "Administrator" : "Sistem"}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-xs text-slate-500 font-semibold self-end sm:self-auto shrink-0 flex items-center gap-2">
                          <time dateTime={item.createdAt}>{formattedDate}</time>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 3: UPLOADS LIST */}
              {tab === "uploads" && (
                <div className="space-y-3">
                  {query.data.items.map((item) => {
                    if (!isUpload(item)) return null;
                    const isImage = /\.(jpe?g|png|webp|gif|svg)$/i.test(item.originalName);
                    const sizeInMb = (item.size / (1024 * 1024)).toFixed(2);
                    const sizeInKb = Math.round(item.size / 1024);
                    const sizeText = item.size >= 1024 * 1024 ? `${sizeInMb} MB` : `${sizeInKb} KB`;
                    const fileUrl = `/api/v1/public/media/${item.id}`;

                    return (
                      <div
                        key={item.id}
                        className="glass-list-card flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-3"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-blue-200/70 bg-blue-50/70 grid place-items-center shadow-2xs">
                            {isImage ? (
                              <Image
                                src={fileUrl}
                                alt={item.originalName}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            ) : (
                              <FileText size={20} className="text-blue-600" />
                            )}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <p className="font-extrabold text-slate-900 text-sm truncate" title={item.originalName}>
                              {item.originalName}
                            </p>

                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-600">
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

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <CopyButton text={fileUrl} label="Salin Tautan" />
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="glass-button-secondary px-3 py-1.5 text-xs"
                          >
                            <ExternalLink size={13} className="text-blue-600" />
                            <span>Buka</span>
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
        description="Kelola akun pengguna, registrasi administrator kelurahan, pantau audit log aktivitas, dan kapasitas penyimpanan berkas."
        icon={UsersShieldSvg}
      />
      <AdminAccess>
        <Management />
      </AdminAccess>
    </main>
  );
}
