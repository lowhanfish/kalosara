"use client";
import { Fragment } from "react";
import { useAuth } from "@/features/auth/auth-provider";
export function AdminAccess({
  children,
  monitoring = false,
}: {
  children: React.ReactNode;
  monitoring?: boolean;
}) {
  const auth = useAuth();
  if (auth.status !== "AUTHENTICATED" || !auth.user) return null;
  if (
    auth.user.role !== "ADMIN_KELURAHAN" &&
    !(monitoring && auth.user.role === "LURAH")
  )
    return (
      <p role="alert">
        Akun Anda tidak memiliki izin untuk mengelola bagian ini.
      </p>
    );
  return <Fragment key={auth.user.id}>{children}</Fragment>;
}
