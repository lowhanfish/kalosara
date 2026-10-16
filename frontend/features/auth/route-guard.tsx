"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthRecovery, useAuth } from "./auth-provider";
import type { AuthUser } from "../../store/auth-store";

// UX only. Every protected API must enforce authorization on the backend.
export function RouteGuard({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: readonly AuthUser["role"][];
}) {
  const { status, user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (status === "GUEST") router.replace("/");
  }, [status, router]);
  if (status === "INITIALIZING") return <p role="status">Memeriksa sesi…</p>;
  if (status === "TEMPORARY_ERROR") return <AuthRecovery />;
  if (status !== "AUTHENTICATED" || !user) return null;
  if (roles && !roles.includes(user.role))
    return <p role="alert">Anda tidak memiliki akses ke halaman ini.</p>;
  return children;
}
