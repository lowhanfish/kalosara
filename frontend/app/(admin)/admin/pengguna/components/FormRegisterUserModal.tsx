"use client";

import React, { useState } from "react";
import {
  UserPlus,
  X,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import { cmsError } from "@/features/cms/client";
import { useCreateMaster } from "../hooks/crud";

function generateSecurePassword(length = 16): string {
  const chars =
    "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*+";
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

export function FormRegisterUserModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("ADMIN_KELURAHAN");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [verified, setVerified] = useState(false);

  const mutation = useCreateMaster(onClose);

  const handleRandomPassword = () => {
    const p = generateSecurePassword(16);
    setPassword(p);
    setShowPassword(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="glass-card w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-6 my-8">
        <div className="flex items-start justify-between border-b border-sky-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <div className="glass-icon-box size-8 rounded-xl">
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
            className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-sky-50 hover:text-sky-700 transition-colors cursor-pointer"
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
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Alamat Email Akun <span className="text-red-500">*</span>
              </label>
              <input
                className="cms-input w-full"
                type="email"
                required
                maxLength={254}
                placeholder="misal: staf.kelurahan@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Nama Lengkap & Gelar (Opsional)
              </label>
              <input
                className="cms-input w-full"
                type="text"
                maxLength={120}
                placeholder="misal: Drs. Amirullah (Kasi Pemerintahan)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Peran Akun & Hak Akses <span className="text-red-500">*</span>
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                {
                  id: "ADMIN_KELURAHAN",
                  title: "Administrator",
                  desc: "Akses Penuh Semua Modul & Kelola Akun",
                  color:
                    "border-sky-300 bg-sky-50/80 text-sky-900 ring-2 ring-sky-500",
                  idle: "border-slate-200 hover:border-sky-200 bg-white/80",
                },
                {
                  id: "LURAH",
                  title: "Lurah",
                  desc: "Akses Monitoring Eksekutif & Pelayanan",
                  color:
                    "border-indigo-300 bg-indigo-50/80 text-indigo-900 ring-2 ring-indigo-500",
                  idle: "border-slate-200 hover:border-sky-200 bg-white/80",
                },
                {
                  id: "MASYARAKAT",
                  title: "Warga",
                  desc: "Aspirasi & Layanan Publik Mandiri",
                  color:
                    "border-emerald-300 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500",
                  idle: "border-slate-200 hover:border-sky-200 bg-white/80",
                },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setRole(item.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    role === item.id ? item.color : item.idle
                  }`}
                >
                  <p className="text-xs font-extrabold">{item.title}</p>
                  <p className="text-[10px] text-slate-500 leading-tight mt-1">
                    {item.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-sky-200/80 bg-sky-50/50 p-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Kata Sandi Baru <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleRandomPassword}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles size={11} />
                <span>Acak Sandi Kuat</span>
              </button>
            </div>
            <div className="relative">
              <input
                className="cms-input bg-white pr-10 w-full"
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
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Kata Sandi Administrator Anda <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                className="cms-input pr-10 w-full"
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

          <label className="flex items-start gap-2.5 rounded-2xl border border-sky-200/70 bg-white/80 p-3.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
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

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-sky-100/70">
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
