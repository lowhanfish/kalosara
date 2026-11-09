"use client";

import React, { useState } from "react";
import {
  KeyRound,
  X,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  RotateCw,
  ShieldCheck,
} from "lucide-react";
import { cmsError } from "@/features/cms/client";
import { useUpdateMaster } from "../hooks/crud";
import type { UserItem } from "../types";

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

export function FormAccessUserModal({
  user,
  onClose,
}: {
  user: UserItem;
  onClose: () => void;
}) {
  const [action, setAction] = useState("REVOKE_SESSIONS");
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [verified, setVerified] = useState(false);

  const mutation = useUpdateMaster(user.id, onClose);

  const handleRandomPassword = () => {
    const p = generateSecurePassword(16);
    setNewPassword(p);
    setShowNewPassword(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="glass-card w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-6 my-8">
        <div className="flex items-start justify-between border-b border-sky-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <div className="glass-icon-box size-8 rounded-xl">
                <KeyRound className="h-4 w-4" />
              </div>
              <span>Kelola Akses & Peran Pengguna</span>
            </h2>
            <p className="text-xs font-bold text-slate-700 pt-1">
              {user.email}
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
              action,
              identityVerified: verified,
              currentPassword: adminPassword,
              expectedUpdatedAt: user.updatedAt,
              ...(action === "RESET_PASSWORD" ? { newPassword } : {}),
              ...(action === "SET_ROLE" ? { role: selectedRole } : {}),
            });
          }}
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Pilihan Tindakan Akses
            </label>
            <select
              className="cms-input font-semibold w-full"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              <option value="SET_ROLE">
                Ubah Peran Akun (Role: Administrator / Lurah / Warga)
              </option>
              <option value="REVOKE_SESSIONS">
                Cabut Semua Sesi Aktif (Logout Paksa)
              </option>
              <option value={user.isActive ? "DEACTIVATE" : "ACTIVATE"}>
                {user.isActive
                  ? "Nonaktifkan Akun Pengguna"
                  : "Aktifkan Kembali Akun Pengguna"}
              </option>
              <option value="RESET_PASSWORD">Reset Kata Sandi Akun</option>
            </select>
          </div>

          {action === "SET_ROLE" && (
            <div className="space-y-2.5 rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Pilih Peran Baru (Role)
              </label>
              <div className="grid gap-2">
                {[
                  {
                    id: "ADMIN_KELURAHAN",
                    title: "Administrator Kelurahan",
                    desc: "Wewenang penuh membuka dan mengelola seluruh fitur.",
                  },
                  {
                    id: "LURAH",
                    title: "Lurah (Pimpinan)",
                    desc: "Akses monitoring eksekutif terhadap data pelayanan & statistik.",
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
                        ? "bg-white border-sky-400 shadow-xs"
                        : "bg-white/60 border-slate-200 hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={item.id}
                      checked={selectedRole === item.id}
                      onChange={() => setSelectedRole(item.id)}
                      className="mt-1 text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {action === "RESET_PASSWORD" && (
            <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Kata Sandi Baru Akun <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleRandomPassword}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg transition-colors"
                >
                  <Sparkles size={11} />
                  <span>Acak Sandi Kuat</span>
                </button>
              </div>
              <div className="relative">
                <input
                  className="cms-input bg-white pr-10 w-full"
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
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Kata Sandi Administrator Anda <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                className="cms-input pr-10 w-full"
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

          <label className="flex items-start gap-2.5 rounded-2xl border border-sky-200/70 bg-white/80 p-3.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
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
                  <span>Memproses...</span>
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
