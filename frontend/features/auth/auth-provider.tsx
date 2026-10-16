"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useStore } from "zustand";
import { useRouter } from "next/navigation";
import { createAuthRuntime } from "./runtime";

const AuthContext = createContext<ReturnType<typeof createAuthRuntime> | null>(
  null,
);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [runtime] = useState(() =>
    createAuthRuntime(fetch, (error, hadIdentity) => {
      // Guest access to public pages is valid. RouteGuard handles protected routes.
      if (!hadIdentity && error?.code === "UNAUTHENTICATED") return;
      if (window.location.pathname !== "/") router.replace("/");
      router.refresh();
    }),
  );
  useEffect(() => {
    void runtime.bootstrap();
    const revalidate = () => {
      void runtime.bootstrap();
    };
    window.addEventListener("focus", revalidate);
    window.addEventListener("online", revalidate);
    return () => {
      window.removeEventListener("focus", revalidate);
      window.removeEventListener("online", revalidate);
    };
  }, [runtime]);
  return (
    <AuthContext.Provider value={runtime}>
      <QueryClientProvider client={runtime.queryClient}>
        {children}
      </QueryClientProvider>
    </AuthContext.Provider>
  );
}
export function useAuthRuntime() {
  const runtime = useContext(AuthContext);
  if (!runtime) throw new Error("AuthProvider is required");
  return runtime;
}
export function useAuth() {
  const runtime = useAuthRuntime();
  return useStore(runtime.store);
}
export function AuthRecovery() {
  const { bootstrap } = useAuthRuntime();
  const { status, error } = useAuth();
  if (status !== "TEMPORARY_ERROR") return null;
  return (
    <div
      role="alert"
      className="container my-4 rounded-lg border border-[#d3b878] bg-[#fff8e5] p-4 text-sm"
    >
      <p>Sesi belum dapat diperiksa. Periksa koneksi lalu coba lagi.</p>
      <p>Referensi: {error?.requestId}</p>
      <button
        className="mt-2 min-h-11 font-semibold underline"
        type="button"
        onClick={() => void bootstrap()}
      >
        Coba lagi
      </button>
    </div>
  );
}
